import "server-only";

/**
 * Email provider seam.
 *
 * The app ships with a mock that logs the sign-in link to the server console
 * instead of sending it, so the whole flow is playable with no provider. To go
 * live, implement this against your sender (Resend, Postmark, SES) and swap
 * the export at the bottom — no caller changes.
 */
export interface EmailProvider {
  readonly name: string;
  readonly isLive: boolean;
  sendLoginLink(input: { to: string; url: string }): Promise<void>;
}

const consoleProvider: EmailProvider = {
  name: "console",
  isLive: false,
  async sendLoginLink({ to, url }) {
    console.info(`[email:mock] sign-in link for ${to}\n  ${url}`);
  },
};

export const email: EmailProvider = consoleProvider;

/**
 * Whether it is safe to hand the sign-in link straight back to the caller.
 *
 * Only true when no real sender is configured AND this is not production —
 * returning a live sign-in link over the API in production would let anyone
 * sign in as anyone.
 */
export function canRevealLinkInResponse(): boolean {
  return !email.isLive && process.env.NODE_ENV !== "production";
}

/**
 * Whether sign-in can work at all right now.
 *
 * In production without a real sender, telling someone to check their email
 * would be a lie: nothing was sent, and they would wait for a link that never
 * arrives. Better to refuse loudly, at the operator rather than the visitor.
 */
export function canSendLoginLinks(): boolean {
  return email.isLive || process.env.NODE_ENV !== "production";
}
