import type { Metadata } from "next";
import { BOX_REWARD, formatCoins, redeemCost } from "@/lib/coins";
import { HOW_IT_WORKS } from "@/lib/howItWorks";

export const metadata: Metadata = {
  title: "Support — Blind Box",
  description: "Answers to the common questions, and how to reach us.",
};

/**
 * Support: the questions people actually ask, answered from the same sources
 * the app runs on, so an answer here cannot say something the app does not do.
 *
 * The contact line appears only when SUPPORT_EMAIL is set — an address made
 * up here would be a promise nobody is reading.
 */
export default function SupportPage() {
  const contact = process.env.SUPPORT_EMAIL;
  const faqs: { q: string; a: string }[] = [
    ...HOW_IT_WORKS.map((s) => ({ q: s.title === "Open" ? "How does a box work?" : s.title === "Collect" ? "Where do my pieces go?" : "How does shipping work?", a: s.body })),
    {
      q: "How do coins work?",
      a: `Every box you open earns coins — ${formatCoins(BOX_REWARD.bronze)} for a Bronze Box up to ${formatCoins(BOX_REWARD.diamond)} for a Diamond Box. Save them up and redeem them for a box: a Bronze Box takes ${formatCoins(redeemCost("bronze"))}. A box redeemed with coins does not earn coins itself. Coins can’t be bought or cashed out.`,
    },
    {
      q: "How do I sign in?",
      a: "With your Apple account, from the profile button at the top right. If you choose Hide My Email, that works fine — order updates go to the relay address Apple gives us.",
    },
    {
      q: "How do I delete my account?",
      a: "Open the profile button at the top right and choose Delete account at the bottom. It happens straight away and can’t be undone.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Support</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        The questions that come up most, answered.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-hairline bg-hairline">
        <ul className="grid gap-px">
          {faqs.map((f) => (
            <li key={f.q} className="bg-ink-card p-5">
              <p className="text-[15px] font-semibold">{f.q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.a}</p>
            </li>
          ))}
        </ul>
      </div>

      {contact && (
        <p className="mt-8 text-sm text-muted">
          Still stuck?{" "}
          <a href={`mailto:${contact}`} className="text-chalk underline underline-offset-4">
            {contact}
          </a>
        </p>
      )}
    </div>
  );
}
