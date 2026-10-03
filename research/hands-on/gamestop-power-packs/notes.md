# GameStop Power Packs — hands-on notes (2026-10-03)

## 1. Access
- powerpacks.com → redirects to powerpacks.gamestop.com → Cloudflare "Performing security verification" (403). Screenshotted once, not bypassed (`01-landing-cloudflare.jpg`).
- Wayback Machine also blocked our headless browser (429 "suspected bot"). Only used the CDX index (snapshot list) — no page screenshot.
- Sources used: App Store listing + 6 official screenshots (iOS app v1.2.3, launched Jul 2026), Google Play listing, GameStop investor press release (14 Apr 2026), fan guides by GameStop ambassador "Roaring Sensei" (roaringsensei.com), review sites (thespike.gg, deadspin.com).
- Did NOT see the live site, a real reveal animation or the odds table myself.

## 2. Landing + pack listing
- App "PACKS" screen (`03-appstore-pack-listing.jpg`): 3D neon arcade cabinet "PSA x GameStop" as hero, then list rows grouped TCG / SPORTS: "Buck's Binder $25 to $2,500 NEW", "Pokemon $25 to $5,000", Baseball/Football/Basketball $25 to $1,000.
- Each row = small slab thumbnail + name + price range + chevron. Bottom tab bar: Packs | wallet balance pill ($289.31) | Collection.
- Themed limited categories rotate (Wayback CDX shows URLs for "2020s Vision", "Art Full", "Cherry Blossom", "BB Classics", "Lightning", "One Piece" (unverified: deadspin)).

## 3. Tiers + prices
- 8 levels: Starter $25, Silver $50, Gold $100, Sapphire $250, Platinum $500, Diamond $1,000, Lunar $2,500, Neutronium $5,000 (unverified: roaringsensei.com, deadspin).
- App Store shot shows a 2x3 tier grid for Pokémon: Starter $25 / Silver $50 / Gold $100 / Platinum $250 / Diamond $1,000 / Lunar $2,500 — so tier names/prices shift per category (Platinum = $250 here).
- Not every tier in every category (sports cap at $1,000).
- 1 PSA-graded slab per pack. Any PSA grade 1–10 possible.

## 4. Pack detail page
- `03-appstore-tier-picker.jpg`: big holo "STARTER PACK" slab-shaped pack art centered in a dark tunnel scene; category title; "Select your level to view values"; tier chip grid; full-width red CTA "Buy Pack for $25".
- Chases + odds + live Card Ladder values shown before buying (App Store description).

## 5. How odds are shown
- Value-band table, not per-card. Example Football Silver $50 (unverified: thespike.gg): $25–35 40.1% · $35–50 30.1% · $50–100 25.1% · $100–200 3.1% · $200–400 1.5% · $400–800 0.1%.
- → ~70% chance the card is worth less than the $50 you paid.
- Odds auto-update every ~5 min as inventory moves (unverified: thespike, roaringsensei).
- Page source (Wayback raw HTML) contains feature flags `experiment_probability_pokemon / _mvp / _basketball` → they A/B test how probabilities are displayed.
- A public share link we decoded showed a $25 Starter pull with "ev": 21.19 and rarity "common" → reveal payload carries a value + rarity label.

## 6. Open / reveal flow (not seen first-hand)
- Pack sits on "a futuristic rail track with speakers", you rip it, "catchy animation", then card (unverified: thespike.gg).
- Result screen (`05-appstore-reveal-result.jpg`): slab big and centred on blurred card-colour background; "ESTIMATED VALUE $31,715"; "PULLED FROM POKEMON $2,500 LUNAR"; share row (Instagram, X, Reddit, share); red CTA "⚡ Sell now for $28,772.10"; caption "90% Buyback offer · Valid for 7 days"; close X + info icon.
- Complaint: animations are "ridiculously long compared to competitors" (Google Play review, Aug 2026). No skip mentioned.
- Bug report: on Android a declined card payment replays your previous pull animation (Google Play review).
- Also "live stream reveals" via approved creators who rip your pack on YouTube/Twitch.

## 7. Rewards
- None found: no welcome bonus, no referral, no loyalty/levels, no daily free pack (unverified: thespike.gg, deadspin). GameStop Pro members get "occasional promos". Creator streams run giveaways/tournaments.
- Social sharing of pulls (share buttons on result) is the main growth loop.

## 8. Vault, shipping, buyback
- Card goes straight to PSA Vault (Delaware, insured, climate-controlled). No storage fee, no time limit.
- Ship home: $1.99 withdrawal fee per card + $5.99 US shipping per shipment (up to 50 cards). Canada $24.99, intl $31.99 (unverified: roaringsensei FAQ).
- Instant buyback (`06-appstore-buyback-offer.jpg`): "REVIEW OFFER $27,045.78 Before fees · Expires in 6d 22h 13m"; "Card Ladder Est: $31,969"; 90% Buyback Offer $28,772.10; 6% Selling Fee −$1,726.32; Total Payout. → net ≈ 84.6% of Card Ladder. Valid 7 days, lost if you ship or list.
- Payout to a "Power Packs Stripe Wallet" → re-buy packs or withdraw to bank (2–3 days).
- After 7 days: PSA Offers or eBay via PSA (~10–13% fees, $3 min).
- Wallet must be pre-loaded with a full pack price (no partial top-up) — user complaint.

## 9. Sign-up wall + onboarding
- Everything behind login; site itself behind Cloudflare. 18+. US residents only for direct buying.
- Signup creates a PSA Vault/Collectors account automatically. ID verification before features (unverified: thespike). Card payments via Stripe (no PayPal/crypto); Google Pay just added on Android (Play "What's new", updated 2 Oct 2026). SMS opt-in for notifications added in iOS v1.2.3.

## 10. Trust signals
- GameStop (NYSE: GME) + PSA brands; every card a PSA slab with cert # verifiable on psacard.com.
- Card Ladder (PSA-owned) live market values; odds shown pre-purchase.
- App Store 4.8 (465 ratings), #172 Entertainment. Google Play 3.9 (123 reviews), 5K+ downloads; recent 1-star reviews call odds "horrible"/"scam".

## 11. Visual style
- Black + saturated red (approx #E21B22 from screenshots, not CSS) with glowing white heavy all-caps headlines.
- Monospace UI type for prices/labels (looks like a terminal/arcade font) + bold grotesk headers.
- 3D white rabbit mascot "Buck" (holding slab, football helmet, reading "Buck's Binder") — gives warmth to a dark, casino-ish UI.
- Feels great: the slab hero on result screen, clear money breakdown on buyback sheet, countdown timer.
- Feels bad: dark red/black reads "casino"; long animations; values shown to the cent everywhere push the "investment" framing.

## 12. Ideas for Blind Box
- COPY: show the "Pulled from: Gold box" line + big centred figure on result screen with share buttons (evidence: 05-appstore-reveal-result).
- COPY: tier chip grid + one full-width "Open Gold for $X" CTA on one screen (03-appstore-tier-picker) — fast tier switching.
- COPY: a mascot. Buck makes a gambling-adjacent product feel friendly; Blind Box's Bearbrick theme suits a mascot even better.
- COPY: value-band odds as an extra view ("chance your piece is worth ≥ box price") next to our per-piece rates — honest and easy to scan.
- AVOID: long unskippable reveal — top complaint. Keep ours ≤3 s with a tap-to-skip.
- AVOID: buyback/sell-back and cash-value framing ("Sell now for $28,772") — keeps us out of gambling territory; our no-sell-back rule is a selling point.
- AVOID: forcing whole-pack wallet top-ups; and never replay an old reveal on payment failure (show a clear error).
- NOTE: their shipping is $1.99/card + $5.99/box; our single flat postage for the whole Vault is simpler — say so on the Vault screen.
