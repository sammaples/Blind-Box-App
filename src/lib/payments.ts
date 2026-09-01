import { randomBytes } from "node:crypto";

/**
 * Payment provider seam.
 *
 * The app ships with a mock provider so the whole flow is playable without
 * keys. Nothing is charged and no card details are ever collected or stored.
 * To go live, implement this interface against Stripe (create a PaymentIntent
 * in `charge`, confirm it client-side) and swap the export at the bottom —
 * no caller changes.
 */
export interface PaymentResult {
  ok: boolean;
  reference: string;
  error?: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly isLive: boolean;
  charge(input: { amountCents: number; description: string }): Promise<PaymentResult>;
}

const mockProvider: PaymentProvider = {
  name: "mock",
  isLive: false,
  async charge({ amountCents }) {
    if (amountCents <= 0) {
      return { ok: false, reference: "", error: "Invalid amount" };
    }
    return { ok: true, reference: `mock_${randomBytes(8).toString("hex")}` };
  },
};

export const payments: PaymentProvider = mockProvider;
