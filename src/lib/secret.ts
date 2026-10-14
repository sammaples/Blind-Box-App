/**
 * The key everything signed is signed with: sessions, the Apple handshake,
 * and the tester pass.
 *
 * Kept apart from auth.ts, which is server-only and reads request cookies,
 * so the proxy in front of every request can use it too.
 */

const DEV_SECRET = "blind-box-development-secret-not-for-production";

export function secret(): string {
  const configured = process.env.AUTH_SECRET;
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET must be set in production. Without it, session cookies " +
        "would be signed with a key that is published in the source.",
    );
  }
  return DEV_SECRET;
}
