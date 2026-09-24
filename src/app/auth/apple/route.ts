import { NextResponse } from "next/server";
import { appleConfig, authorizeUrl, newHandshake } from "@/lib/apple";
import { rememberHandshake, safeNext } from "@/lib/auth";

/**
 * The way in: hands someone off to Apple.
 *
 * A GET rather than a POST because it is a link, and because there is nothing
 * to protect here — it starts a handshake and redirects. The thing worth
 * guarding is the callback, and the state cookie planted here is what guards
 * it.
 */
export async function GET(request: Request) {
  const config = appleConfig();
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));

  if (!config) {
    // Nothing is configured, so say so on the page the visitor came from
    // rather than showing them an Apple error they cannot act on.
    const back = new URL(next, url.origin);
    back.searchParams.set("signin", "unconfigured");
    return NextResponse.redirect(back);
  }

  const handshake = newHandshake();
  await rememberHandshake(handshake, next);

  return NextResponse.redirect(authorizeUrl(config, redirectUri(request), handshake));
}

/**
 * Where Apple sends people back to.
 *
 * It must match a Return URL registered on the Services ID character for
 * character, so it is pinned by configuration first and only derived from the
 * request when nothing is set. Deriving it is the fallback, not the rule:
 * behind a proxy the request's own origin can be an internal hostname, and a
 * mismatch here is rejected by Apple with `invalid_redirect_uri`.
 */
export function redirectUri(request: Request): string {
  const configured = process.env.APPLE_REDIRECT_URI;
  if (configured) return configured;
  return new URL("/auth/apple/callback", request.url).toString();
}
