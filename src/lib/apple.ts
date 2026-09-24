import "server-only";
import { createHash, createPrivateKey, createPublicKey, randomBytes, sign as nodeSign, verify as nodeVerify } from "node:crypto";

/**
 * Sign in with Apple.
 *
 * The whole flow in one file, on `node:crypto`, because the two pieces of
 * cryptography it needs are small and a JWT dependency is not: minting a
 * client secret (ES256 over a key Apple gave us) and checking an identity
 * token (RS256 against keys Apple publishes).
 *
 * Apple's variant of OpenID Connect has four habits worth knowing before
 * reading any of this, because each one shapes the code below:
 *
 *  1. The client secret is not a secret. It is a short-lived JWT you sign
 *     yourself with a `.p8` private key. It expires — six months is Apple's
 *     ceiling — so it has to be minted per request rather than configured.
 *  2. The callback is a POST, not a GET, whenever a scope is requested.
 *     Apple `form_post`s to the redirect URI, which means the browser arrives
 *     at our callback cross-site, which means the state cookie has to survive
 *     a cross-site POST. That is what forces `SameSite=None`.
 *  3. The name is offered once, in that POST, on the first authorisation
 *     only. Ask again later and you get nothing. It is not in the token.
 *  4. The email may be a relay (`Hide My Email`). It works, it is not the
 *     person's real address, and it is not a stable key. `sub` is the key.
 */

const AUTHORIZE_URL = "https://appleid.apple.com/auth/authorize";
const TOKEN_URL = "https://appleid.apple.com/auth/token";
const KEYS_URL = "https://appleid.apple.com/auth/keys";
const ISSUER = "https://appleid.apple.com";

/** Apple's ceiling for a client secret is six months; a day is plenty. */
const SECRET_TTL_S = 60 * 60 * 24;
/** How long someone has to get through Apple's screens and come back. */
export const HANDSHAKE_TTL_MS = 10 * 60 * 1000;

export interface AppleConfig {
  /** The Services ID, not the App ID — Apple calls this the client id. */
  clientId: string;
  teamId: string;
  keyId: string;
  /** The contents of the `.p8`, PEM and all. */
  privateKey: string;
}

/**
 * The configuration, or null when it is absent.
 *
 * Null is a normal state, not a failure: a fresh clone has no Apple account
 * behind it, and the app still has to run. Callers offer the dev door instead.
 */
export function appleConfig(): AppleConfig | null {
  const clientId = process.env.APPLE_CLIENT_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  // Vercel's environment editor turns real newlines into `\n`, and a PKCS8
  // PEM with literal backslash-n in it is not a key. Undo that here rather
  // than asking whoever pastes it to know about it.
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientId || !teamId || !keyId || !privateKey) return null;
  return { clientId, teamId, keyId, privateKey };
}

export function appleConfigured(): boolean {
  return appleConfig() !== null;
}

/* ------------------------------ base64url ------------------------------- */

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function unb64url(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

/* --------------------------- the client secret --------------------------- */

/**
 * Mints the client secret Apple wants at the token endpoint.
 *
 * ES256, and the signature has to be the raw r‖s pair a JWT uses rather than
 * the DER wrapper OpenSSL reaches for by default. `ieee-p1363` is that
 * encoding; without it Apple rejects every exchange with `invalid_client`,
 * which is an unhelpful way to be told the bytes are packaged wrong.
 */
function clientSecret(config: AppleConfig): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: config.keyId, typ: "JWT" };
  const claims = {
    iss: config.teamId,
    iat: now,
    exp: now + SECRET_TTL_S,
    aud: ISSUER,
    sub: config.clientId,
  };

  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const signature = nodeSign(null, Buffer.from(body), {
    key: createPrivateKey(config.privateKey),
    dsaEncoding: "ieee-p1363",
  });
  return `${body}.${b64url(signature)}`;
}

/* ------------------------------ the handshake ---------------------------- */

export interface Handshake {
  /** Round-trips through Apple and must come back unchanged. */
  state: string;
  /** Bound into the identity token, so a replayed token is detectable. */
  nonce: string;
}

export function newHandshake(): Handshake {
  return {
    state: randomBytes(24).toString("base64url"),
    nonce: randomBytes(24).toString("base64url"),
  };
}

/**
 * Where to send someone to sign in.
 *
 * `response_mode=form_post` is not a choice. Ask for any scope and Apple
 * insists on it, and we ask for both: the email to send dispatch notes to,
 * and the name, which is offered exactly once and never again.
 *
 * The nonce goes over as a SHA-256 of the real one. Apple echoes whatever it
 * is given straight into the token, so hashing means the value sitting in a
 * URL in someone's history is not the value that proves the token is ours.
 */
export function authorizeUrl(
  config: AppleConfig,
  redirectUri: string,
  handshake: Handshake,
): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", handshake.state);
  url.searchParams.set("nonce", hashNonce(handshake.nonce));
  return url.toString();
}

export function hashNonce(nonce: string): string {
  return createHash("sha256").update(nonce).digest("hex");
}

/* ------------------------------ the exchange ----------------------------- */

export interface AppleIdentity {
  /** Stable, opaque, and the only thing an account should be keyed on. */
  sub: string;
  /** Real or a Hide My Email relay. Either way it is deliverable. */
  email: string | null;
  /** Whether Apple says the address is verified. Relays always are. */
  emailVerified: boolean;
}

/**
 * Trades the code for an identity token and checks it is one of ours.
 *
 * Every check here has a specific forgery in mind. The signature and issuer
 * say Apple minted it; the audience says it was minted for this app and not
 * some other one that shares a user base; the nonce says it belongs to the
 * handshake this browser started rather than being replayed from elsewhere;
 * the expiry says it is not being reused later.
 */
export async function exchangeCode(
  config: AppleConfig,
  code: string,
  redirectUri: string,
  nonce: string,
): Promise<AppleIdentity> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: clientSecret(config),
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Apple refused the code exchange (${res.status}): ${detail.slice(0, 200)}`);
  }

  const payload = (await res.json()) as { id_token?: string };
  if (!payload.id_token) throw new Error("Apple returned no identity token");

  const claims = await verifyIdentityToken(payload.id_token, config.clientId, nonce);
  return {
    sub: claims.sub,
    email: typeof claims.email === "string" ? claims.email.toLowerCase() : null,
    // Apple sends this as a string on some paths and a boolean on others.
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
  };
}

interface AppleClaims {
  iss: string;
  aud: string | string[];
  sub: string;
  exp: number;
  nonce?: string;
  email?: unknown;
  email_verified?: unknown;
}

async function verifyIdentityToken(
  token: string,
  clientId: string,
  nonce: string,
): Promise<AppleClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Identity token is not a JWT");
  const [rawHeader, rawClaims, rawSignature] = parts;

  const header = JSON.parse(unb64url(rawHeader).toString()) as { kid?: string; alg?: string };
  if (header.alg !== "RS256") throw new Error(`Unexpected token algorithm ${header.alg}`);
  if (!header.kid) throw new Error("Identity token names no signing key");

  const key = await applePublicKey(header.kid);
  const ok = nodeVerify(
    "RSA-SHA256",
    Buffer.from(`${rawHeader}.${rawClaims}`),
    key,
    unb64url(rawSignature),
  );
  if (!ok) throw new Error("Identity token signature does not check out");

  const claims = JSON.parse(unb64url(rawClaims).toString()) as AppleClaims;
  if (claims.iss !== ISSUER) throw new Error(`Identity token issued by ${claims.iss}`);

  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audience.includes(clientId)) throw new Error("Identity token is for another app");

  if (claims.exp * 1000 <= Date.now()) throw new Error("Identity token has expired");
  if (claims.nonce !== hashNonce(nonce)) throw new Error("Identity token belongs to another sign-in");
  if (!claims.sub) throw new Error("Identity token names no subject");

  return claims;
}

/* ------------------------------ Apple's keys ----------------------------- */

/**
 * Apple's public keys, cached for an hour.
 *
 * They rotate, and a token can name a key that was not in the set last time
 * we looked — so a miss refetches once before giving up rather than failing
 * the sign-in over a stale cache. The cache lives in module scope, which on
 * a serverless host means per-instance; that is the right size for it, since
 * the only cost of a cold instance is one extra request to Apple.
 */
let keyCache: { at: number; keys: Map<string, string> } | null = null;
const KEY_TTL_MS = 60 * 60 * 1000;

async function applePublicKey(kid: string): Promise<string> {
  const cached = keyCache && Date.now() - keyCache.at < KEY_TTL_MS
    ? keyCache.keys.get(kid)
    : undefined;
  if (cached) return cached;

  const res = await fetch(KEYS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not fetch Apple's signing keys (${res.status})`);
  const { keys } = (await res.json()) as { keys: Array<Record<string, string>> };

  const fresh = new Map<string, string>();
  for (const jwk of keys) {
    if (!jwk.kid) continue;
    // Node reads a JWK directly, so there is no modulus arithmetic to get
    // wrong here; it is exported to PEM only because that is what verify
    // wants to be handed.
    try {
      fresh.set(jwk.kid, createPublicKey({ key: jwk, format: "jwk" }).export({
        type: "spki",
        format: "pem",
      }) as string);
    } catch {
      // One unreadable key is not a reason to reject the rest of the set.
    }
  }
  keyCache = { at: Date.now(), keys: fresh };

  const key = fresh.get(kid);
  if (!key) throw new Error(`Apple published no signing key called ${kid}`);
  return key;
}

/* -------------------------------- the name ------------------------------- */

/**
 * The name out of the callback's `user` field, if this is a first sign-in.
 *
 * Apple sends it as a JSON string in the form post, once, and never again —
 * so it is read here and stored immediately, because there is no second
 * chance to ask. Anything malformed is simply nobody's name.
 */
export function nameFromCallback(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const parsed = JSON.parse(raw) as { name?: { firstName?: unknown; lastName?: unknown } };
    const first = typeof parsed.name?.firstName === "string" ? parsed.name.firstName.trim() : "";
    const last = typeof parsed.name?.lastName === "string" ? parsed.name.lastName.trim() : "";
    const full = `${first} ${last}`.trim();
    return full.length > 0 ? full.slice(0, 120) : null;
  } catch {
    return null;
  }
}
