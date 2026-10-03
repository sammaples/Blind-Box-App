# Arena Club (Slab Packs) — hands-on notes (2026-10-03)

## 1. Access
- arenaclub.com → Cloudflare "Performing security verification" (403). Screenshotted once (`01-landing-cloudflare.jpg`), not bypassed.
- Help centre (arenaclubsupport.zendesk.com) and collect.arenaclub.com also Cloudflare-walled (`01b-helpcentre-cloudflare.jpg`). Wayback blocks our browser (429).
- Sources used: App Store listing + 5 official screenshots (v5.2.34), Arena Club's own blog (content.arenaclub.com loads fine), SI.com press, help-centre snippets via search results, review sites (ripranks, packripping, deadspin, 10kcardjourney first-hand blog), third-party EV tracker shouldirip.com.
- Did NOT see a live pack page or reveal myself.

## 2. Landing + pack listing
- 62 Slab Packs on sale right now across 9 tiers (unverified: shouldirip.com, 3 Oct 2026 — `13-third-party-ev-tracker.jpg`).
- Categories: baseball, football, basketball, soccer, hockey, Pokémon, Star Wars, Disney, Lorcana, One Piece + "Special Series". New drops on set days (Tue/Fri in 2025, per blog). Also "Time Boxes" for luxury watches (Rolex, Cartier…).
- App also = marketplace (buy/sell/trade/live auctions) + AI grading service + "digital showroom".

## 3. Tiers + prices (gem ladder)
- Bronze $25 · Silver $50 · Gold $100 · Ruby $250 · Emerald $500 · Diamond $1,000 · Legendary $2,500 · Crown Jewel $5,000 · Special Series $50–$1,500 (unverified: shouldirip.com).
- 1 graded slab per pack now (`03-appstore-pack-detail.jpg`: "Basketball · Diamond · 1 slab/pack"). Older 2024 packs had multiple slabs (Black pack = most slabs).
- Each pack = its own fixed pool; tier name is printed on the foil pack ("DIAMOND MULTI-SPORT", "RUBY BASEBALL").

## 4. Pack detail page
- `03-appstore-pack-detail.jpg`: white page, back + share icons, big foil pack (ice-blue faceted pattern, diamond icon, sport balls) with two real slabs fanned behind it; carousel dots; bottom sheet "Basketball / Diamond · 1 slab/pack".
- Below: "Available Slabs" list with Grail / Chase sections and per-card hit rate (`04-appstore-odds-checklist.jpg`).

## 5. How odds are shown
- Per-card, published checklist ("LIVE AND TRANSPARENT CHECKLIST"). Each card row: slab photo, rarity label, "Hit Rate per Card 0.15%", player + set.
- Rarity buckets: Grail (~0.01–0.13%), Chase (~0.5%), Tier 1/2/3 or "Lineup" (the majority, usually worth < pack price) (unverified: ripranks, blog).
- "Hit Feed" shows recent hits and remaining grails; odds update as the pool depletes. Help FAQ titles show users worry about packs selling out before grails are hit and grails changing mid-drop.
- Claims shuffle = Fisher-Yates (blog), no provably-fair proof.
- Third party computes EV per pack: on 3 Oct 2026 the best packs were −4.7% to −12.5% EV; "10 packs were +EV in last 14 days" (shouldirip.com).

## 6. Open / reveal flow (not seen first-hand)
- `05-appstore-reveal-are-you-ready.jpg`: full-screen red gradient, big italic "ARE YOU READY?" over the foil pack (Ruby Baseball) — a tear/rip step.
- `06-appstore-reveal-slab.jpg`: slab revealed full-screen on a blurred colour wash taken from the card art (orange for Charizard).
- Reviewers: "smooth pack opening animation", "reveal flow felt snappy and reliable" (unverified: deadspin, packripping). Connection-loss during reveal is handled (card still assigned — help FAQ title).
- After reveal: buyback offer, list, trade, ship, or keep in showroom.

## 7. Rewards
- No referral programme right now (help article "Do you have a referral program?" → no, "exploring ways to reward loyal collectors"). A 2024 blog mentioned a refer-a-friend reward — since dropped.
- "Arena Club Credits" exist (help article) — store credit from buybacks/promos.
- First-purchase promo: ~20% off / $20 off code (unverified: deadspin, packripping). No daily free pack, no levels, no leaderboards found.
- Promotions: limited "guaranteed case hit" drops; $25 packs with a Michael Jordan grail as headline (SI.com).

## 8. Vault, shipping, buyback
- Vault: insured, 24/7 monitored, climate-controlled; no storage fees, no space limits (App Store).
- Ship out: $1 retrieval fee per card + shipping (by size/destination/speed) + insurance on declared value; up to 20 cards per delivery, 4-business-day fulfilment guarantee (unverified: help-centre snippet, deadspin).
- Instant buyback: 90% of Arena Club's own valuation (not a third-party index). Older reviews quote 80%.
- "Slab Safe": pay +10% at checkout → guaranteed offer ≥ 80% of pack price (or 90% of card value, whichever higher). First-hand blog: $100 Gold pack, got a card AC valued $100 (eBay comps $50–60), offered $90.
- Marketplace selling + live auctions as other exits.

## 9. Sign-up wall + onboarding
- Must log in to buy. Phone verification at sign-up, ID checks + full profile later; 18+; KYC may be needed to ship (unverified: deadspin, packripping).
- Payments: cards, Apple/Google/Amazon Pay, bank transfer, USDC crypto (unverified: deadspin).

## 10. Trust signals
- Celebrity founder: Derek Jeter with CEO Brian Lee (unverified: SI.com headline "Derek Jeter and Brian Lee Talk Arena Club Insights"); eBay partnership for physical Slab Packs ($250, 400/series, from Jul 2025).
- Every slab PSA/BGS/SGC/CGC graded, cert visible on the slab label in the reveal.
- App Store 4.5 (6.3K ratings), #166 Shopping. Negative review: "0 for 20 … down 50%… slot machine".
- Independent EV tracker exists because the pool is fully public — transparency invites scrutiny.

## 11. Visual style
- Light theme: white/light-grey (#F2F2F2-ish) with black; accent = acid lime gradient (≈ #39FF14 → #E0FF5C, read from screenshots, not CSS).
- Type: heavy condensed italic all-caps display face ("BUY, SELL, AND TRADE", "SLAB PACKS®") + clean grotesk UI text.
- Lightning-bolt / chevron tag shapes as brand motif. Foil packs with gem-faceted patterns per tier colour.
- Feels great: clean white product pages make it feel like a shop, not a casino; gem-coloured foil packs make each tier instantly recognisable.
- Feels bad: odds sheet is long/dense; the "Grail 0.15%" framing still oversells the dream.

## 12. Ideas for Blind Box
- COPY: gem-tier colour system on the box art itself (Bronze/Silver/Gold/Diamond already match theirs — make each box visibly that material) — evidence 03/05 screenshots.
- COPY: per-piece checklist with photo + rarity label + hit-rate %, grouped Grail/Chase/Common — we already publish per-piece rates; present them like 04-appstore-odds-checklist.
- COPY: "Hit Feed" style recent-pulls ticker and "X grails left" counter from our live stock shelf — honest scarcity that actually reflects inventory.
- COPY: "ARE YOU READY?" pre-reveal beat then full-screen piece on a colour wash taken from the figure — cheap to build, feels premium.
- AVOID: house-valued buyback and paid "Slab Safe" insurance — complex, looks like gambling, draws "slot machine" reviews. Our no-sell-back + coins is cleaner.
- AVOID: per-card retrieval + insurance fees; our flat Vault postage is simpler — show the total up front.
- WATCH: publishing everything lets third parties compute EV; make sure our published rates are accurate since someone will check.
