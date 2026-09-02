import "server-only";

/**
 * Email provider seam.
 *
 * Ships with a mock that logs the sign-in link instead of sending it, so the
 * whole flow is playable with no account anywhere. Set RESEND_API_KEY and
 * EMAIL_FROM and it sends for real. To use a different sender, write another
 * EmailProvider and pick it in `chooseProvider` — no caller changes.
 */
export interface EmailProvider {
  readonly name: string;
  readonly isLive: boolean;
  sendLoginLink(input: { to: string; url: string }): Promise<void>;
}

/* ------------------------------------------------------------------ *
 * The message
 * ------------------------------------------------------------------ */

const SUBJECT = "Your Blind Box sign-in link";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Plain text matters: some clients show it, and some people prefer it. */
function textBody(url: string): string {
  return [
    "Here is your sign-in link for Blind Box:",
    "",
    url,
    "",
    "It works once and expires in fifteen minutes.",
    "If you did not ask to sign in, you can ignore this — nothing has happened.",
  ].join("\n");
}

function htmlBody(url: string): string {
  const safe = escapeHtml(url);
  // Inline styles and a table: email clients are not browsers.
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:440px;background:#ffffff;border-radius:16px;padding:32px;
                    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.14em;
                    text-transform:uppercase;color:#8b8b99;">Blind Box</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#17171c;">
            Sign in to collect
          </h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4a4a55;">
            Tap the button to sign in. It works once, and expires in fifteen minutes.
          </p>
          <a href="${safe}"
             style="display:inline-block;background:#17171c;color:#ffffff;
                    text-decoration:none;font-size:15px;font-weight:600;
                    padding:14px 28px;border-radius:999px;">Sign in</a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8b8b99;">
            Or paste this into your browser:<br>
            <span style="word-break:break-all;color:#4a4a55;">${safe}</span>
          </p>
          <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e6e6ea;
                    font-size:13px;line-height:1.6;color:#8b8b99;">
            If you did not ask to sign in, ignore this email — nothing has happened.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

const consoleProvider: EmailProvider = {
  name: "console",
  isLive: false,
  async sendLoginLink({ to, url }) {
    console.info(`[email:mock] sign-in link for ${to}\n  ${url}`);
  },
};

/** Overridable so a test can point the provider at a stand-in server. */
const RESEND_URL = process.env.RESEND_API_URL ?? "https://api.resend.com/emails";

function createResendProvider(apiKey: string, from: string): EmailProvider {
  return {
    name: "resend",
    isLive: true,
    async sendLoginLink({ to, url }) {
      const res = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject: SUBJECT,
          html: htmlBody(url),
          text: textBody(url),
        }),
      });

      if (!res.ok) {
        // The body often names the real problem — an unverified domain, a bad
        // key — and that is worth having in the log rather than a bare status.
        const detail = await res.text().catch(() => "");
        throw new Error(
          `Resend refused the message (${res.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`,
        );
      }
    },
  };
}

function chooseProvider(): EmailProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (apiKey && from) return createResendProvider(apiKey, from);

  // Half-configured is a mistake worth naming. Falling back to the mock keeps
  // production refusing sign-in rather than silently sending nothing.
  if (apiKey && !from) {
    console.warn(
      "[email] RESEND_API_KEY is set but EMAIL_FROM is not, so no email can " +
        "be sent. Set EMAIL_FROM to an address on a domain verified with Resend.",
    );
  } else if (!apiKey && from) {
    console.warn("[email] EMAIL_FROM is set but RESEND_API_KEY is not.");
  }

  return consoleProvider;
}

export const email: EmailProvider = chooseProvider();

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
