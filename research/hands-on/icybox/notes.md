# IcyBox — hands-on notes (2026-10-03)

## 1. Access
- icybox.com returns **502**. The real site is **https://www.icybox.io** (found via the App Store listing's developer links). It loads with no bot wall (01–07).
- The web is a marketing site plus a support FAQ plus terms. All box play is in the iOS app ("Get the app"). I didn't install the app or sign up.
- Sources: icybox.io (landing, /support, /terms), App Store listing id6758816716 (7 screenshots, ratings, reviews, version history), GlobeNewswire press release 2026-10-01, review sites (mymillennialguide, tunedandgroomed, justuseapp). Items from those are marked unverified.
- Company: InfiniteEdge Inc., Wilmington DE. Founder Jian Lu. Launched April 2026 (press release). App first released 2026-03-07 per App Store, v3.1.7 on 2026-09-30.

## 2. Landing + box listing
- Web hero: "THE NEW WAY TO GET YOUR HANDS ON LUXURY – Authentic watches and bags. Pick a box, open it, keep it or sell it back." An auto-scrolling strip of grails with prices: AP Royal Oak "Spider-Man" $250.0k, Patek Aquanaut $80.0k, Hermès Kelly $34.5k… (01).
- 3 steps: Pick a box ("Boxes from $50 to $1,000") → Unbox it ("Tap to open") → Keep it, sell it, ship it (02).
- "Drops – limited edition boxes, once they're gone, they're gone" with a countdown timer. Stats: 4.3 rating, "75K+ grails pulled", "3,500+ product catalog" (03).
- In the app: Watches/Bags toggle, a horizontal carousel of 3D jewellery-box tiers, an "Available watches" strip with brand + value, then **Min Value / Max Value** and "Buy for $1,000" (10-2). Bottom tabs: Boxes / Showcase / Collection / Rewards.

## 3. Tiers + prices
- Five tiers "from Bronze to the flagship Icy Box", each showing min and max value (unverified: press release).
- Prices seen or claimed: $50, $100 ("Silver"), $150 (bags), $250 ("Ruby"), $500, $1,000 ("Icy Box"). Limited "Amber & Tanzanite" boxes (v2.9.0) and an Independence Day $250 box.
- Min/max seen: **Icy Box $1,000: min $309 / max $121,500** (10-2). **Bags box $150: min $70 / max $26,500** (10-3).
- Reported typical outcomes (unverified: tunedandgroomed): $50 → $40–60, $100 → $60–500, $250 → $100–500 with a rare $10k+, $500 → $200–600.
- Each tier is a coloured 3D wooden/marble jewellery box with a gold keyhole: ice-blue, bronze, burgundy, slate, gold, brown, red (10-4, 10-7).

## 4. Box detail
- Tapping a box opens a "pull odds modal showing the probability and value range for each rarity tier before buying" (FAQ, 04).
- "Available watches / Details >" strip previews the top pieces with values (10-2).

## 5. How odds are shown
- Odds are given per **rarity band**, not per item. There are six bands from Grail down to Common, plus Uncommon / Rare / Epic (press release + reviews). Grail is about 0.4–3% depending on the box, e.g. "2.4%" and "3% on the $250 box" (unverified: App Store reviews).
- Review complaint: "Don't trust the odds… a lot of 'grail' watches are only in the $500 range. They only show you the $10k–$15k watches as 'grail' wins." The banding hides the real value spread.
- Terms: "the probability of receiving a specific Asset is made available on the Platform." A live public feed of pulls is claimed (press release).

## 6. Open / reveal
- FAQ: "After purchase, **swipe to open** and reveal your watch." Version notes add "New pull animations" (2.6.0), "**Tap To Skip Animation**" (2.4.0), sounds (2.3.0, 2.8.3, 3.0.1), and "rarity tiers" (3.0.1).
- Reveal screen (10-5): full-bleed colour by rarity (gold glow + bubbles for GRAIL). Rarity chip "GRAIL" + brand chip "TISSOT", item name, big value "$575". White "Keep" button. Pill below: "**Swipe to sell >>  90% Buyback offer $517.50**", with ToS consent text under it.
- I didn't see the motion myself (app-only).

## 7. Rewards
- A Rewards tab exists (10-2). Terms §13 mention "incentives, prizes, points, or rewards… referrals or performing a certain number of transactions". The details weren't public.
- Referral: friend gets $5 credit on sign-up with the code, and the referrer gets $5 credit after the friend's first box (FAQ). Promo codes on review sites: "$5 off + a free re-spin" (unverified).
- Gifting + limited drop boxes (v2.7.0). Showcase tab (likely the live pull feed). No daily free box seen.

## 8. Vault, shipping, buyback
- Items sit in Collection. **Vaulted items are held 7 days, then auto-sell at 90% of listed value** (FAQ).
- Sell-back = instant **90%** buyback to a *withdrawable* balance (10-5). Terms: "We do not disclose how we calculate the Buyback Price." Sales can't be undone.
- Cash-out: Account → Withdraw, min $6, fees vary. Venmo 1–5 days, bank 2–5 days or same-day (FAQ). Reviewers mention a $2 fee (unverified).
- Two balances: Credit (deposited, Apple Pay/Google Pay, box-only) vs Withdrawable (from sales).
- Shipping: "varies by item and destination". Items $500+ carry mandatory insurance. 15–20 business days to leave the warehouse (FAQ). Reviewers report about $30–32 per watch, **each watch ships separately**, and "+$40 sales tax, insurance and premium shipping" on keeping (unverified: App Store reviews). Ship-confirm screen: USPS Ground Advantage, 15 business days (10-6).

## 9. Sign-up wall
- No web play at all. The app needs an account plus a deposit before any box. 18+ (Terms §6), App Store age rating 18+ "Contains Loot Boxes". Reviewers say cash-out asks for SSN and birthday (unverified: justuseapp).

## 10. Trust signals
- 4.3★ from 6.6K App Store ratings, #64 in Shopping. "75K+ grails pulled", "Authenticity guaranteed" (10-5), real brand logos, Stripe as payment processor, Delaware entity, arbitration clause.
- Disclaimer: "we do not guarantee that the luxury item will be new (unworn)".
- Negatives: a wrong watch shipped (BTOMIC instead of Fossil), inflated valuations, separate shipping per item, the site scored "24.2/100 trust" by a validator (unverified: bynudge).

## 11. Visual style
- Electric blue #0532FF (CSS), with a pink-red accent #F62451 (CSS). Black/white app with dark glassy cards. Gold value text for grails.
- Type: "specialGothic" condensed caps for headlines, Manrope/Inter body, **JetBrains Mono for prices** ("$10,598.70" balance pill, "$1,720"). The mono font gives a ticker/finance feel.
- 3D rendered jewellery boxes with gold keyholes, which feel premium and tactile. Pixel-art cursor as a playful accent.
- Feels great: the per-tier coloured box object, min/max on the buy card, the rarity-colour reveal screen, swipe gestures.
- Feels bad: it reads like a casino (balance pill always on, "swipe to sell" right under "Keep"), the value claims are inflated, and fees appear late.

## 12. Ideas for Blind Box
- Copy **Min value / Max value on every tier card** under the buy button. It's the simplest way to show range (10-2). We already have pull rates, so add min/max per tier.
- Copy the tier as a **physical 3D box object** with its own colour/material (Bronze/Silver/Gold/Diamond), not a flat badge (10-4).
- Copy the reveal layout: background colour by rarity, a rarity chip, name, one primary action. Add **tap to skip** and sounds (10-5, version notes).
- Copy the swipe-to-open gesture.
- Copy the live "Showcase" feed of recent pulls as social proof.
- Avoid: rarity bands that hide value spread. Show per-piece rates plus each piece's real value, as we do now (review complaint).
- Avoid: sell-back, withdrawable cash balances, an always-on $ balance pill and auto-sell timers. These are the gambling-like mechanics (18+, "Contains Loot Boxes", SSN at cash-out). Blind Box's no-sell-back, reward-only-coins model is a trust and legal advantage. Say so on the site.
- Avoid: per-item shipping and surprise insurance/tax at ship time. Our Vault + one flat postage is a direct answer to IcyBox's top complaint.
