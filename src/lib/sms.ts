import "server-only";
import { randomInt } from "node:crypto";

/**
 * Sign-in codes by text message.
 *
 * The provider both sends the code and checks it, so no code is ever stored
 * here. Ships with a mock that logs the code instead of texting it, so the
 * flow works with no account anywhere. Set TWILIO_ACCOUNT_SID,
 * TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID and it texts for real
 * through Twilio Verify, which also handles rate limits and SMS fraud.
 */
export interface SmsVerifier {
  readonly name: string;
  readonly isLive: boolean;
  /** Texts a code. Returns it only from the mock, for local testing. */
  send(phone: string): Promise<{ devCode?: string }>;
  /** Whether this code is the one most recently sent to this number. */
  check(phone: string, code: string): Promise<boolean>;
}

/** A refusal worth showing as is, such as a number that cannot take texts. */
export class SmsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ *
 * Twilio Verify
 * ------------------------------------------------------------------ */

function twilioVerifier(accountSid: string, authToken: string, serviceSid: string): SmsVerifier {
  const base = `https://verify.twilio.com/v2/Services/${encodeURIComponent(serviceSid)}`;
  const auth = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;

  const post = (path: string, form: Record<string, string>) =>
    fetch(`${base}/${path}`, {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form),
    });

  return {
    name: "twilio-verify",
    isLive: true,
    async send(phone) {
      const res = await post("Verifications", { To: phone, Channel: "sms" });
      if (res.ok) return {};
      const body = (await res.json().catch(() => ({}))) as { code?: number; message?: string };
      // The ones a person can do something about get said plainly; the rest
      // are the operator's problem and are logged for them.
      if (body.code === 60200 || body.code === 21211 || body.code === 60205) {
        throw new SmsError("That number can’t receive texts. Check it and try again.", 400);
      }
      if (body.code === 60203 || res.status === 429) {
        throw new SmsError("Too many codes for that number. Wait a few minutes and try again.", 429);
      }
      if (body.code === 60410 || body.code === 60605) {
        throw new SmsError("We can’t text that number right now.", 400);
      }
      throw new Error(`Twilio ${res.status}: ${body.code ?? ""} ${body.message ?? ""}`.trim());
    },
    async check(phone, code) {
      const res = await post("VerificationCheck", { To: phone, Code: code });
      // 404 is "no code waiting": expired, already used, or never sent.
      if (res.status === 404) return false;
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { code?: number; message?: string };
        if (body.code === 60202) {
          throw new SmsError("Too many tries. Ask for a new code.", 429);
        }
        throw new Error(`Twilio ${res.status}: ${body.code ?? ""} ${body.message ?? ""}`.trim());
      }
      const body = (await res.json()) as { status?: string };
      return body.status === "approved";
    },
  };
}

/* ------------------------------------------------------------------ *
 * The mock
 * ------------------------------------------------------------------ */

const MOCK_TTL_MS = 10 * 60 * 1000;
const mockCodes: Map<string, { code: string; expiresAt: number }> =
  ((globalThis as { __bbSmsCodes?: Map<string, { code: string; expiresAt: number }> }).__bbSmsCodes ??= new Map());

const consoleVerifier: SmsVerifier = {
  name: "console",
  isLive: false,
  async send(phone) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    mockCodes.set(phone, { code, expiresAt: Date.now() + MOCK_TTL_MS });
    console.info(`[sms] sign-in code for ${phone}: ${code}`);
    return { devCode: code };
  },
  async check(phone, code) {
    const held = mockCodes.get(phone);
    if (!held || held.expiresAt < Date.now() || held.code !== code) return false;
    mockCodes.delete(phone);
    return true;
  },
};

function chooseVerifier(): SmsVerifier {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (sid && token && service) return twilioVerifier(sid, token, service);
  if (sid || token || service) {
    console.warn(
      "[sms] Phone sign-in needs all three of TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN " +
        "and TWILIO_VERIFY_SERVICE_SID; texting is off until they are set.",
    );
  }
  return consoleVerifier;
}

export const sms: SmsVerifier = chooseVerifier();

/** Whether phone sign-in can work at all. The mock never runs in production. */
export function canTextCodes(): boolean {
  return sms.isLive || process.env.NODE_ENV !== "production";
}

/** Whether the code may go back in the response: only the mock, never live. */
export function canRevealCodeInResponse(): boolean {
  return !sms.isLive && process.env.NODE_ENV !== "production";
}

/** A code as typed, reduced to its digits, or null if it cannot be one. */
export function normaliseSmsCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  return digits.length >= 4 && digits.length <= 10 ? digits : null;
}
