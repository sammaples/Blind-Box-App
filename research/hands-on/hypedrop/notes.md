# HypeDrop — notes from public sources (2026-10-03)

## 1. Access
- hypedrop.com → www.hypedrop.com: **Cloudflare "Performing security verification" (403)** wall (01). Respected; no bypass. help.hypedrop.com also returned 403.
- Wayback Machine blocks headless browsers (429 "suspected bot", 02), so no archive screenshot. The raw archived HTML (2026-06-23) is a JS shell with no content.
- No iOS app. The old Play listing "HypeDrop" (com.xbrsoft) is an unrelated game, unpublished 2022.
- So everything below is **(unverified)**, from: Trustpilot (fetched today), gamechampions.com review (1 Oct 2026), boxverdict.com (27 Jul 2026), tech-insider.org (May/Aug 2026). The review sites are affiliate SEO pages; treat their numbers as indicative.

## 2. Landing + box listing (unverified)
- Mystery boxes in categories: sneakers, electronics, designer, collectibles, jewellery, tech. Dark and light mode. Responsive web only (gamechampions).

## 3. Tiers + prices (unverified)
- No fixed tiers. Entry boxes $0.17–$0.99; mainstream sneaker boxes $19–$129; top about $1,900 (tech-insider).

## 4. Box detail page
- Not seen. Per-item odds, item names and sell-back values are shown before purchase (tech-insider).

## 5. How odds are shown (unverified)
- Per-item %, two decimals (e.g. 0.26% top prize, 41.20% most common) (tech-insider).
- Provably fair: server seed (revealed after) + client seed + nonce; the reviewer reproduced 5 draws.

## 6. Open/reveal flow
- Not observed (wall). No source describes the animation. Unknown whether a demo or quick-open exists.

## 7. Rewards (unverified)
- Signup: **3 free boxes + 5% deposit bonus** (code "HypeDrop").
- **Daily free boxes need KYC first**; contents scale with loyalty level. XP comes from opening (can also be bought). "Bolts" currency earned by spending → Bolt boxes (boxverdict).
- Daily race $4,000 / weekly race $20,000 pools, top 25 (gamechampions).
- Battles: shared, jackpot, terminal, crazy modes. **Deals** (pick price → odds scale), **Upgrader**, **Black Market** (4 dealer characters you negotiate with), raffles.
- Affiliates up to 10% commission; referred users get 3 free boxes.

## 8. Vault, shipping, cash-out (unverified, sources conflict)
- Ship, upgrade/exchange, or sell back. Sell-back measured at **71–82% of item value** (avg 74.4%) (tech-insider).
- Shipping: "some items free, others a fee" (gamechampions). Tech-insider claims $7.99 US ground / $19.99 expedited and an "18% convenience fee on wins" — unconfirmed. Delivery 3–14 days (test avg 6.4 business days) vs "7–30 days" (gamechampions).
- Withdraw crypto only, 2% fee. KYC (ID + selfie + address) at first crypto withdrawal and for physical redemption. Restricted: Idaho, Washington.

## 9. Sign-up wall + onboarding
- Not observed. Self-declared DOB at signup; full KYC later (tech-insider).

## 10. Trust signals
- **Trustpilot 4.1/5, 1,750 reviews** (174 in the last 12 months); 75% 5★, 12% 1★; replies to 93% of negative reviews (fetched 2026-10-03).
- Praise: fast shipping, authentic items, packaging. Complaints: shipping delays, **KYC blocking withdrawals**, Canada stock, support on account issues, RTP.
- Operator: Plutonomy Limited (Belize); payments via Omnifarious Services Ltd (Cyprus). Running since 2018. No licence cited.

## 11. Visual style
- Not observed. Dark + light themes exist (gamechampions).

## 12. Ideas for Blind Box
- COPY: answer most negative reviews publicly (93% reply rate); it keeps their Trustpilot at 4.1 despite 12% 1★.
- COPY: a small welcome pack (3 free boxes) → our version: 3 free daily-spin credits or a starter coin grant, no deposit bonus.
- AVOID: gating the "free daily box" behind KYC. Our free daily spin should need only a login.
- AVOID: Black Market / Upgrader / battles / crypto-only cash-out. Gambling-adjacent, and they create KYC friction and complaints.
- NOTE: a site that blocks bots at the front door also blocks link previews and SEO crawlers. Keep Blind Box's landing crawlable.
