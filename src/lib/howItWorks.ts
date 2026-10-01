/**
 * How the shop works, in three steps, because there are three.
 *
 * Shared by the overlay behind the "?" on the shop and the /how-it-works page,
 * and the welcome cards say the same things in the same order: two
 * explanations of one product are two things to keep in step, and the one
 * nobody notices going stale is the one nobody is looking at.
 *
 * Written short and flat on purpose. The price is a number rather than a
 * policy, because "flat rate" is a phrase people skip and "$5" is not.
 */
export const HOW_IT_WORKS = [
  {
    title: "Open",
    body: "Choose a box and open it. What is inside is drawn when you buy, against rates published per piece.",
  },
  {
    title: "Collect",
    body: "Everything you open goes straight to your vault. Nothing ships until you say so, and nothing expires.",
  },
  {
    title: "Ship",
    body: "Pick what you want sent and it goes in one parcel. Shipping is always $5, however many pieces are in it.",
  },
] as const;
