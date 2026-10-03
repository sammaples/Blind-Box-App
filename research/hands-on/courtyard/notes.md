# Courtyard.io — hands-on notes (2026-10-03)

## 1. Access
- courtyard.io loaded fine on iPhone 14 Pro emulation. No bot wall.
- Pages need ~15 s to hydrate (skeletons before that).
- Used: landing, /vending-machine (pack list), 2 pack pages (Pokémon PSA 10, Sports Inferno), Distribution sheet, Buy tap (sign-up sheet), /leaderboard, side menu.
- The site's own public JSON (`api.courtyard.io/vending-machines`, loaded by the page) lists all 107 packs with odds, EV, buyback ratio and pull counts. Saved as `odds-all-packs-2026-10-03.csv`.
- Reveal: no free demo. I pulled the pack's public reveal MP4s (the same files the page uses) and grabbed frames.
- Help centre (help.courtyard.io): buyback, rewards FAQ, points/leaderboard, quests, shipping, vault, GVP codes.
- No account made, nothing bought.

## 2. Landing + pack listing
- Landing: an 11-slide hero carousel (Inferno, PSA 10, Vintage, Hockey, Watches, Sneakers, Coins…) with "Rip Now" CTAs, then "Just Pulled" (didn't load for me: "Couldn't load recent pulls"), then "Popular Packs" with 24 h buy counts (Pokémon Starter $25 **9.6K**, Basic $15 8.6K, PSA 10 $69 6.6K), then "Best Deals" (marketplace, "31% off").
- /vending-machine: tiles for each category (Limited, Pokémon, Sneakers, One Piece, Wildcard, Sports, Baseball, Coins, Basketball, Football, Soccer, Hockey, Watches, Comics, MTG, Sealed Booster). Each tile shows a foil pack render. Under it is a list: pack name ›, price pill, "Sold Out" greyed.
- Some packs show a gold **"🔒 Gold+"** badge, so they're locked to loyalty tier Gold and above (02-pack-listing-2).

## 3. Tiers + prices
- Price ladder, the same in every category: Basic $15 · Starter $25 · Pro $50 · Master $100 / $250 · Platinum $500 · Diamond $1,000 · Legend $2,500 · Mythic $5,000 / $10,000 / $20,000 (watch boxes).
- "Limited" drops have odd prices: $49, $69, $99, $149, $199, $749, $750. "Spicy" variants cost $1 less ($249/$499/$999/$2,499) and have wider chase bands.
- EV is printed as "Average item value". It's always **96% of price** (e.g. $69 → $66.24, $750 → $720).
- Max 5 per transaction (1x–5x selector).

## 4. Pack detail page
- Top bar: "‹ Back to packs" on the left, "⌄ Distribution" on the right.
- Big centred foil pack on a themed gradient (red for PSA 10, fire for Inferno). Gold+ lock pill above the title if gated.
- Segmented control 1x 2x 3x 4x 5x, then a full-width blue "Buy for $69".
- Description. Then **"Heavy Hitters"**: a 2-col grid of real slabbed cards with grade pill + $ value (PSA 10 $1,069.60…). "Show more".
- "More Limited" cross-sell list at the bottom.
- Pack art carries promo text, e.g. "+5% BUYBACK" printed on the Inferno pack.

## 5. How odds are shown
- Tapping "Distribution" opens a bottom sheet. It shows **5 colour-coded value bands**, each a $ range + %:
  - PSA 10 $69: $48–60 **57%** · $60–69 20% · $69–138 20% · $138–276 3% · $276–1.1k **0.2%**
  - Inferno $750: $375–565 53% · $565–750 19% · $750–1.5k 22% · $1.5k–3k 5% · $3k–48k 0.8%
- Footnote: "*Average item value is $66.24. Distribution is calculated in real-time… Comps are informed by recent sales…"
- Colours: base = grey, common = green, uncommon = blue, rare = purple, chase = orange/gold.
- Odds are value bands, not named items. Roughly 75–80% of pulls are worth less than the price. Bands 1+2 sit below the price on every pack.
- API has per-pack pull counts (24h/7d/30d) and an inventory list with tier + FMV per card.

## 6. Open/reveal flow (seen via official MP4s, not a live rip)
- `pack_pulling_animation.mp4` (6.7 s): a 3D branded vending machine with a neon screen. A pack drops into the tray, the camera pushes in, and the pack floats centre with a gentle sway (05-frame1–3).
- `reveal_animation.mp4` (5.2 s, **has audio**, about −26 dB mean): the pack spins edge-on twice, tears open in two halves at ~3.5 s, then a white flash to black (05-frame4–6). Then the card (each card has its own `nft_animation.mp4` slab spin) shows with its value and the buyback offer (unverified: PackSpy/press).
- Each pack has its own 3D render, machine, hero art and reveal video. That is heavy art production.
- Skip button: not seen (behind login).

## 7. Rewards
- **Points**: 5,000 pts = $25 pack credit; points last 1 year (help centre).
- **Weekly Quests**: 6 random quests each week ("Open a Pokémon pack", "Open a pack worth $50+"). One buy can clear several. Reset Tue 09:00 UTC; unclaimed points expire.
- **Monthly Leaderboard**: podium with avatars + trophy points (1st 275.4K). Resets Nov 1 00:00 UTC with a countdown pill. Top 100 get prizes. Points come from spend.
- **Rewards tiers** (quarterly seasons): Silver / Gold / Platinum / Diamond, by pack spend.
  - Monthly perks: Silver $15 free pack + $25 Guaranteed Value Pack … Diamond $100 free + $500 GVP.
  - Gold+ unlocks exclusive packs. Platinum gets 5 free shipments/mo; Diamond gets 10.
  - You drop one tier each new season.
- **Guaranteed Value Pack codes**: a promo code sets a buyback floor for one pack (e.g. $50 min).
- Raffles/events (Community Choice, Pokémon Vintage) are in the menu.
- No free daily spin seen. Referrals are off for packs (`referralProgramEnabled:false`).

## 8. Vault, shipping, buyback
- Every pull is a real graded card held in Courtyard's US vault (Delaware ship origin), insured and free to store. Brink's per press (unverified: PackSpy).
- Shipping: FedEx at cost by destination and weight, plus handling at busy times. Up to 10 business days to process. Ships worldwide. Platinum/Diamond tiers get free shipments.
- **Instant buyback**: a cash offer based on FMV that lasts **7 days**. The API `buybackRatio` = **0.846** (0.896 on "+5% BUYBACK" packs). Third parties say 90% FMV (unverified: PackSpy).
- Marketplace: peer-to-peer resale, 0% seller fee. Withdraw $ balance. Cards are tokenised (Privy wallet, external wallets allowed). You can ship your own cards in from eBay/PWCC/PSA.

## 9. Sign-up wall
- You can browse everything, odds included, without an account.
- Tapping "Buy" opens a bottom sheet "Sign up": email + Submit, Google, Apple. "Protected by Privy" sits at the bottom, which means a wallet is made behind the scenes.
- No age gate shown before the sheet.

## 10. Trust signals
- Real slab photos with cert numbers, plus "Heavy Hitters" with $ values.
- Live odds and EV in the open. Footnote says comps come from real sales.
- Social proof: 24 h buy counts on packs, "Just Pulled" feed, leaderboard names.
- Company address in the NY footer. Help centre. iOS + Android apps.
- PackSpy (unverified): Trustpilot ~3.0/5. Complaints are about shipping fees on cheap cards and slow support. YC-backed, ~$37.5M raised.

## 11. Visual style
- Pure black page `#000000`. Cards `#131319` / `#0f0f14` / `#212126`. Text white; muted text `#8b94a3`.
- Primary CTA blue `#2f5bf9`. Gold+ badge `#c9a84c`. Font **Inter** throughout, bold and large.
- Feels great: glossy 3D foil packs on themed gradients. The odds bottom sheet is very clean. The leaderboard podium has a reset countdown.
- Feels bad: slow first paint (skeletons ~10 s). Hero carousel is crowded (11 slides). "Just Pulled" failed to load. Lots of "Spicy/Inferno/64× ceiling" casino language.

## 12. Ideas for Blind Box
- **Copy the Distribution bottom sheet** (04-odds-psa10): 4 colour chips, one per tier, each with %. Add an "average value" footnote. Ours can name pieces, which beats Courtyard's $ bands.
- **Show "Heavy Hitters"** (03b): a grid of the real top pieces on the shelf with photos. It makes the chase concrete.
- **Leaderboard with a reset countdown + podium** (06). Cheap to build and drives return visits. Tie it to coins, not spend, to stay on the right side of "pay to win".
- **Weekly quests that one purchase can stack** (help article). An easy add next to our daily spin.
- **Monthly free box by tier** instead of a cash buyback. It keeps our "no sell-back" stance while still rewarding loyalty.
- **Per-tier pack art + short 5 s reveal with sound + skip** (05 frames): spin, tear, flash. Keep it under ~5 s and let users skip after the first one.
- Avoid: an instant cash buyback at 85–90% plus "+5% BUYBACK" packs. That is a loop that reads as gambling (rip → cash → rip). Also avoid 1x–5x multi-buy plus Gold+ spend-gated packs. Sam's model (no sell-back, reward-only coins) is safer. Say so on the page as a trust point.
- Avoid an unpredictable shipping fee. Courtyard's #1 complaint is FedEx-at-cost. Our flat postage is a selling point; show it on the box page.
