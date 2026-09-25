import { randomBytes } from "node:crypto";

/**
 * Payment provider seam.
 *
 * The app ships with a mock provider so the whole flow is playable without
 * keys. Nothing is charged and no card details are ever collected or stored.
 *
 * ── On Apple Pay ─────────────────────────────────────────────────────────
 *
 * Apple Pay is not a payment provider. It is a way for a browser to hand a
 * card to one, and something still has to take that card: Apple does not
 * settle money, hold funds or issue refunds. So "pay with Apple Pay" means
 * "Stripe, with Apple Pay as the sheet" — or Adyen, or Braintree — and the
 * work is implementing `PaymentProvider` against that processor. Apple Pay
 * then costs one extra thing: a domain association file, served from
 * /.well-known, proving the site is allowed to raise the sheet.
 *
 * Doing it directly, without a processor, means a merchant certificate,
 * session validation against Apple's servers on every single payment, and
 * then decrypting the payment token yourself — and at the end of it you have
 * a card number and still no way to charge it. There is no version of this
 * where the processor is skipped.
 *
 * ── Why there are two shapes below ───────────────────────────────────────
 *
 * `charge` is one-shot: the server takes the money and the answer is yes or
 * no. That is all a mock needs, and all a server-side card charge needs.
 *
 * Apple Pay cannot work that way. The sheet is raised by the browser, the
 * person authorises with their face or thumb, and the confirmation happens
 * client-side — so the server's job splits in two: mint an intent before,
 * verify it after. That is `intent` and `settle`. A provider that cannot do
 * Apple Pay simply does not implement them, and `supportsWalletSheet` says
 * so, so the UI can offer the sheet only where there is something behind it.
 */
export interface PaymentResult {
  ok: boolean;
  reference: string;
  error?: string;
}

/**
 * A payment the browser will finish.
 *
 * `clientSecret` is whatever the processor's client SDK needs to raise the
 * sheet — for Stripe, a PaymentIntent's client secret. It is safe to send to
 * the browser and useless without the publishable key.
 */
export interface PaymentIntent {
  ok: boolean;
  reference: string;
  clientSecret?: string;
  error?: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly isLive: boolean;
  /**
   * Whether this provider can raise a wallet sheet — Apple Pay, Google Pay.
   * False on anything that can only take a card server-side, which is what
   * keeps the UI from offering a button that cannot do anything.
   */
  readonly supportsWalletSheet: boolean;

  /** Takes the money server-side. The whole transaction, in one call. */
  charge(input: { amountCents: number; description: string }): Promise<PaymentResult>;

  /**
   * Starts a payment the browser will finish.
   *
   * Only meaningful where `supportsWalletSheet` is true. The amount is
   * decided here, never read from the request that triggered it — a client
   * that names its own price is a client that pays its own price.
   */
  intent?(input: { amountCents: number; description: string }): Promise<PaymentIntent>;

  /**
   * Confirms, with the processor, that a payment the browser says succeeded
   * actually did.
   *
   * This call is not optional paranoia and it is not a formality. Everything
   * the browser reports about a wallet payment is a claim made by code that
   * anybody can edit; the only thing that settles it is asking the processor
   * what it holds. Nothing is credited or shipped before this answers yes.
   */
  settle?(reference: string): Promise<PaymentResult>;
}

const mockProvider: PaymentProvider = {
  name: "mock",
  isLive: false,
  // The mock has no sheet to raise. Turning this on without a processor
  // behind it would make the app offer an Apple Pay button that cannot take
  // a payment, which is worse than not offering one.
  supportsWalletSheet: false,
  async charge({ amountCents }) {
    if (amountCents <= 0) {
      return { ok: false, reference: "", error: "Invalid amount" };
    }
    return { ok: true, reference: `mock_${randomBytes(8).toString("hex")}` };
  },
};

export const payments: PaymentProvider = mockProvider;

/**
 * Whether the app should offer a wallet sheet at all.
 *
 * Asked through the provider rather than an environment variable, so the
 * answer cannot drift from what is actually wired up.
 */
export function walletReady(): boolean {
  return payments.supportsWalletSheet && typeof payments.intent === "function";
}
