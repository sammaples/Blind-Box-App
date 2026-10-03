# Phygitals — notes (2026-10-03) — mostly from public sources

## 1. Access
- **www.phygitals.com is blocked**: Vercel Security Checkpoint, HTTP 429, "We're verifying your browser" (00). I screenshotted it once and didn't try to get past it.
- **Wayback Machine also returned 429** ("flagged as suspected abusive bot traffic") for /claw and / (00b). Didn't retry.
- Sources used instead:
  - **docs.phygitals.com**: loads fine, and the full corpus is in `llms-full.txt` (pack opening & buyback, provable fairness, Pack Party rules, vault, shipping, KYC, ToS, USA shipping-fee table) (07, 08b)
  - **App Store** listing (Apple lookup API: 5 screenshots, description, rating) (01–03, 06, 08)
  - Third-party reviews: Deadspin, The Grueling Truth (unverified: third-party)
  - Jupiter Gacha docs (Phygitals packs also sell inside Jupiter)
- **Nothing on the live site was seen first-hand.** Everything about UI and flow below is from screenshots, docs or reviews.

## 2. Landing + pack listing
- App shot 1 (01): top category icons (Pokémon, One Piece, Basketball, Yu-Gi-Oh!, Baseball). Packs show as a carousel of foil packs (One Piece Starter / **Legend** / Platinum). Under the focused pack: "Legend Pack", **"Pack Odds – Medium ›"**, "What's…", Min value **$125**, Max pull **$16.7K**.
- Web: each pack lives at `/claw/<pack>` (e.g. /claw/legend-pack, /claw/platinum-pack per search results).
- App description: "Pack tiers visually ranked from entry to top-tier" and **"Adjustable risk levels on supported packs — pick the spice you want"**.

## 3. Tiers + prices (unverified: Deadspin, 2026)
- Range is $10–$5,000.
- Pokémon $25 / 50 / 250 / 500 / 1,000 / 2,500 / 5,000.
- One Piece $25 / 50 / 80 / 250 / 500 / 1,000 / 2,500.
- Basketball $50 → $5,000. Baseball $25 → $500. Football $25 → $1,000.
- Pack names seen: Starter, Elite ($50), Legend, Platinum, Diamond (App shot 3, "BASKETBALL Diamond").
- Up to **8 packs at once** with +/– or "Max" (Deadspin).
- Payment: card, USDC/USDT wallet, or a mix. Reviewers report a 4.6–4.8% "service fee" on packs and 5.47% on deposits (unverified: Deadspin).

## 4. Pack detail page (unverified: reviews + app shots)
- Shows the chase list ("We display a list of the chases… so you know what's on the line": docs), odds by value group, average EV, min value / max pull, and a risk level (Low/Medium/High…).
- Buyback-boost badge: "Some packs show a boosted buy back of **90%, 92% or 100%**, marked with a bright green label at the top of the pack image" (Deadspin). The docs agree that enhanced-rate packs carry a badge.

## 5. How odds are shown
- Value bands + % + EV (docs "Full Transparency"). Example One Piece Elite $50: **$25–50 80% · $50–100 15% · $100–400 4% · $400–15,000 1%**, "Expected Value $51 per pack" (Deadspin). Elite Pokémon $50: 80/15/4/1 with $24–60 / $60–120 / $120–250 / $250–5,000+ (Grueling Truth).
- Same 80/15/4/1 structure as Collector Crypt.
- **Provably fair** commit-reveal: server-seed SHA-256 hash is shown first, a client seed is added, the seed is revealed after. Every past opening is listed at `/fairness` (docs).

## 6. Open/reveal flow (not seen; from docs, reviews, app shots)
- **Claw machine**: tap a pack and a "cool futuristic" claw machine appears (on the left on desktop, at the top on mobile). It grabs and delivers your pack with a smooth animation. Reviewers call it "just a gimmick — no actual risk of dropping the pack" (Deadspin, Grueling Truth).
- Then cards are "unveiled **one at a time** with visual effects that reflect the rarity" and special effects for high-value pulls (docs).
- App shot 2 (02): reveal card screen. Slab photo, "**EPIC**" red pill, "Value: $20,500", and a split button: green **"Sell $20,500"** | dark **"Vault"**. "1 of 1" pager.
- App also has "**Sell All**" and a "**Fast-accept mode for one-tap selling**" (App Store description).
- App v1.1.9 notes "smoother pack reveals". Reviews praise "amazing UI and animations" (App Store, unverified).
- Sound / skip: unknown.

## 7. Rewards
- **Global leaderboard**: ranks collections (sets completed, rare cards, milestones). "Each week, Phygitals awards **$1,000+ in vouchers** to the top collectors" (docs).
- **Badges & achievements**, set-completion tracking (docs "Track and Optimize Your Collection").
- **Referrals**: 1% of referees' claw-machine buybacks (Deadspin, Grueling Truth). The invitee may get a discount or a special buyback offer on their first purchase (docs).
- **Pack Party**: a creator puts 2–8 of their own cards in a pool and sets an entry price. Others join; when it's full, cards are randomly dealt. There's a countdown, and fees are refunded if it doesn't fill. The platform takes a fee (docs).
- **Stream**: bid on sealed packs and watch them opened live (docs).
- Promotions with a free entry route ("log in daily to accumulate points") (ToS §24). VIP program with an XP bar is mentioned but not documented (unverified: Deadspin).
- No welcome bonus (unverified: Grueling Truth).

## 8. Vault, shipping, buyback
- Vaults: **PSA, Fanatics, Alt** (US). Cards held 1:1, insured, compressed NFTs on Solana.
- **Buyback**: default **85% of FMV**, boosted on some packs up to 100%. Paid in USDC.
  - Windows: **30 min** for standard cards, 3 days sealed, 7 days inventory. The countdown starts at the reveal; one offer per card (docs).
  - Marketing headline: "100% BUY BACK!" (app shot 2), with fine print "up to 100%".
- **Shipping/redeem**: a per-item withdrawal fee shown before confirming.
  - USA table (08b): **$15.41** (value ≤$500, zone 2) to $83.89 (≤$50k, zone 8), "includes shipping, liability and 1 lb".
  - Per vault (unverified: Deadspin): PSA $6.98 + $5.99; Alt $20 flat; Fanatics 3% of value + shipping.
  - Timing: PSA 2–3 weeks; Fanatics/Alt 1–2 weeks. Multi-vault claims arrive as separate parcels.
- Marketplace fee 2%. **Pawn**: borrow against cards at a flat interest rate.

## 9. Sign-up wall
- Unknown on web (blocked). App: email, SMS, Google, Apple, or Phantom wallet. Guest accounts allowed for limited browsing/buying (ToS).
- Reviews say there is phone verification plus an optional quiz on risk tolerance, games and budget (unverified: Deadspin).
- KYC on demand. App Store age rating **17+/18+**, advisories "Loot Boxes" and "Infrequent/Mild Contests".

## 10. Trust signals
- App Store **4.7★ (611 ratings)**. iPhone app released 2026-07-31, v1.1.9 on 2026-09-21.
- Provably fair page per user. Big-name vaults (PSA, Fanatics, Alt). Backers: Solana, Tensor (docs "Our Partners").
- Very thorough legal docs: refund policy, restricted jurisdictions, business continuity if they go insolvent.
- Against it: the main site sits behind a bot wall. Fee confusion (4.6–4.8% "random" service fees). Complaints about slow support and shipping delays (App Store reviews, unverified). Docs still have `localhost:5173` links in places.

## 11. Visual style (from App Store shots)
- Deep electric-blue gradient backgrounds. Heavy italic condensed display type (white + **neon green** accents, about `#3cff2a`). Glossy holographic foil packs.
- In-app: dark navy UI, category icon row, green "+" balance pill, green→dark split Sell/Vault button, red "EPIC" rarity pill.
- Great: one bold message per App Store shot ("OPEN REAL CARDS!", "SELL YOUR PULLS"). The Sell | Vault split choice on the reveal is very clear.
- Bad: "RARE PACKS, REAL MONEY." and "100% BUY BACK!" read like casino ads. The "*up to 100%" fine print misleads, since the default is 85%.

## 12. Ideas for Blind Box
- **Claw-machine-style delivery animation as pure theatre** (Deadspin): a fun 2–3 s mechanical "fetch" before the reveal, with no fake near-miss. A good fit for a figure shelf; the claw grabs the box off our live shelf.
- **Reveal one item, then a clear two-choice bar** (02): ours would be "Keep in Vault" | "Open another", with no Sell option.
- **Show Min value / Max pull / chase list on each box** (01). Easy to add next to our pull rates.
- **Set-completion badges + collection leaderboard** (docs). These reward collecting, not spending, which fits reward-only coins.
- **Per-user fairness page** with seed hashes (docs). A low-cost trust win.
- **Shipping fee table published up front** (08b). We can beat it: one flat postage for the whole vault, shown on every box page.
- Avoid: 30-minute buyback countdown + "Sell All" + one-tap fast-accept. That's urgency plus a frictionless cash-out loop. Also avoid "up to 100%" fine print, risk "spice" sliders, referral payouts tied to friends' buybacks, and stacked % service fees. Sam's no-sell-back, flat-postage model is the opposite of these; say so plainly.
