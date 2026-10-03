# Blind Box (our app) — hands-on, 2026-10-03

Live site: https://ripnshipapp.vercel.app, iPhone 14 Pro viewport, logged out.
The same screens were captured for every competitor, for side-by-side comparison.

## 1. Access
- Everything loads. Sign-in is closed (beta): "Apple sign in isn't available right now"; email/phone buttons shown.
- So the paid open/reveal and the Vault with items could not be seen live. Reveal notes below come from the code.

## 2. Landing + box listing
- `01-landing.jpg`: "Pick your box", turning 3D box, swipe carousel with 4 dots (Bronze/Silver/Gold/Diamond), a "Recent pulls" strip, odds bars, a big "Buy a box" button and a 4-tab bottom bar (Boxes, Current stock, Vault, Rewards).
- **No price anywhere on the front page.** The price only appears on the checkout sheet, after you tap Buy. This was a deliberate choice (comment in `src/components/Shop.tsx`).
- `01c-tier-*.jpg`: **Silver, Gold and Diamond all show "Sold out"** today. Only Bronze is live.
- The box art is the same on every tier: a pale-blue box with a "?" pattern. Tiers differ only by name colour.

## 3. Tiers + prices
- Four tiers. The brief says Bronze is $25 and Diamond $250, but no prices are visible before checkout.
- Sizes (100% / 400% / combo) are not explained on any public page.

## 4. Box detail page
- "Box details" goes to the Live Stock page for that tier (`02a-box-details.jpg`). There is no dedicated box page with the line-up, value range or size.

## 5. How odds are shown
- Front page: rarity bars (Bronze: Common 76.3%, Chase 23.7%).
- `04-stock-odds.jpg`: every piece with its photo, series, rarity and live %. This is better than most competitors, which show value bands.
- Missing: units left per piece, retail value per piece, odds history, and an odds snapshot on the receipt.
- The footer says "Every order stores the seed it was drawn from". That is a good trust line, but there is no page where a user can check it.

## 6. Open / reveal
- Not seen live (needs sign-in plus checkout).
- From the code (`BoxOpening.tsx`): a custom animated box opening with sound. There is no skip / quick-open, no share card or clip, and no "open several" option.

## 7. Rewards
- `06-rewards.jpg`: Daily spin (live), plus Challenges and Refer a friend, both marked "Soon".
- `07-spin.jpg`: a polished wheel with 14 equal slices: one 1,500, two 250, eleven 50.
  - **The visible slices suggest a 1-in-14 jackpot; the real odds are 1%** (behind the "i" button).
  - UK ASA guidance says segments should match the real odds, or the odds should be on the wheel.
- Tapping Spin when logged out shows a sign-in sheet.
- `09-wallet.jpg`: ways to earn (10 coins per $1, daily spin). Coin rules are in the FAQ: 2,500 coins = a Bronze box, no buying or cashing out coins.
- No streaks, levels, collection book, leaderboard or referral yet.

## 8. Vault / shipping / fees
- `08-vault.jpg`: "My vault — Nothing opened yet" plus a CTA.
- Shipping is flat **$5 per parcel, any number of pieces, nothing expires** (onboarding card 3 and the FAQ). This is the strongest offer in the category; competitors charge per item (see their notes).
- No sell-back (correct, keep it).

## 9. Sign-up wall + onboarding
- `00-onboarding-1..3.jpg`: three full-screen cards (Open / Collect / Ship), then "Start collecting".
  - **The cards show on every fresh load**, by design (`Onboarding.tsx`). Repeat visitors see a full-screen cover each time.
- Browsing is free. Buying or spinning opens a sign-in sheet (`03-buy-tap.jpg`) that says: "A box is a real object that has to reach you, so sign in before you buy. It takes one tap." Good copy.
- "Browse as guest" is offered.

## 10. Trust signals
- Present: per-piece odds, "seed stored" line, flat shipping, "Demo build — nothing is charged".
- Missing:
  - Terms of Service: "being finalised" (`11-terms.jpg`).
  - Privacy: short interim text (`12-privacy.jpg`).
  - No age gate (18+).
  - No company name or address.
  - No authenticity promise for the figures.
  - No support email or response time.
  - No reviews or social proof beyond the pulls strip.
- The public footer shows an "Inventory management" link (admin). Hide it from shoppers.

## 11. Visual style
- Dark ink background with warm copper/bronze glow, bronze CTA, gold "Recent pulls", script logo, system sans type, monospace percentages.
- Feels premium and calm.
- Weak spots:
  - The generic "?" box art doesn't say "Bearbrick".
  - No hero photo of real figures above the fold.
  - Small piece thumbnails in the pulls strip.
  - Three sold-out tiers make the shop look empty.

## 12. Gaps vs competitors (detail in REPORT.md)
- Prices on the front page.
- A box detail page.
- Skip / quick-open, and a share card.
- Wheel slices that match the odds.
- Streaks, a collection book, referrals.
- Published terms and an 18+ gate.
- An authenticity guarantee.
- Units left per piece.
- Restock / "notify me" for sold-out tiers.
