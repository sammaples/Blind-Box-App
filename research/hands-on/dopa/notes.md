# DOPA! (online oripa / mystery packs) — hands-on, 2026-10-03

Two sites, same company (SINSA K.K.): Japan `dopa-game.jp` (points, yen) and US/global `dopa-global.com` ($, App Store id6502881148 "DOPA! - Online Mystery Packs").

## 1. Access
- JP site and US site both loaded with no login, iPhone 14 Pro viewport. No bot wall.
- JP pack page loaded first time, then showed "予期せぬエラーが発生しました" (unexpected error) on reloads. I did not retry in a loop. The JP reveal demo was not captured.
- US site: "Try Demo" works with no account. It plays a real reveal video (`/video/demo`). Headless Chromium could not decode it (HEVC), so I downloaded the public MP4 from their CDN and pulled frames from it.
- Not seen first-hand (sign-up needed): buying, inventory, shipping screen, daily wheel. Those come from FAQ, purchase terms, App Store, and JP guide sites, marked "unverified".

## 2. Landing + pack listing
- JP (`01-jp-landing`): loud pachinko-style banners ("max 90% OFF first purchase", "1.5M users"), category tabs (Pokémon, One Piece, Yu-Gi-Oh, ... POP MART, apparel, hobby, food), and "166 packs on sale". Bottom tab bar: Packs / Live feed / Ranking / Win history / My page.
- Each card shows a live "⚡ 14人" (people pulling now), tags (time-limited, bonus, high price, 50/50, low price), price per pull, **"残り 762/1,000" (remaining / total tickets)**, and a "min guarantee" value.
- US (`07-us-landing`): dark UI. "Rip packs digitally. Ship hits, trade the rest." CTA "Get 2 free $2 packs". "4.8 App Reviews · 1M+ daily collectors". **Live Updates feed with tabs Pulled / Shipped / Livestream** (PSA10 slabs with $ value and time ago), then "Hot packs" and UGC testimonials.
- Google One-Tap sign-in sheet slides up on first load.

## 3. Tiers + prices
- JP: from 1 pt to 200,000 pt per pull. Packs run from 400 to 6.5M tickets (e.g. 2,000,000-ticket pack at 5 pt/pull).
- US: named ladder "PSA10 Insured Drop – $70+ / $120+ Assured", "PSA10 Gold / Platinum / Diamond Pack". Diamond = **$1,000/pack**, "$120 Insured Drop" = **$120/pack**. Listing cards also show large figures ($6,500 to $100,000) whose meaning is unclear (unverified: probably the pool or top-prize value).
- Bulk buttons: 1x / 10x / 100x / 1000x pull (JP `03`).

## 4. Pack detail page
- JP (`03-jp-pack-detail-5pt`): hero art with "総還元率95%" (total return-to-player 95%), "最低保証 4" (min guarantee 4 pt), "過去1時間に477人がこのオリパを引きました" (477 people pulled in the last hour), a **green progress bar of remaining tickets 1,093,601 / 2,000,000**, then 1/10/100/1000-pull buttons, then a long legal block explaining that odds are as at launch and the top prize may already be gone.
- US (`08-us-pack-detail`): pack image (foil pouch + slab), "⏳ 7 Days Only", chips (JP · PSA10 · Beginners Only · PSA10 Only), price, sticky **Try Demo | Buy $120.00** bar, then odds, then "Inside pack" grid. Each card in the grid shows a tier badge (Grail / 1st tier / 2nd tier), its $ value and its %.

## 5. How odds are shown
- JP odds table (`04-jp-odds-table`): total tickets 2,000,000. Per prize tier it shows **count of tickets** and % to 10 decimals: S 30 (0.0015%), A 152 (0.0076%), B 0, Other 1,999,818 (99.99%), plus the Last One prize (1 box, "-%"). Footnotes: odds are calculated at launch, not at purchase, and Last One is excluded.
- US (`08-us-pack-detail-full-odds`): **value-band bar chart** ($0–60 / $60–120 / $125–240 / $240–320 / ...), each with a %, plus "Biggest win 3x" and "Floor value $125". The bands add up to **100.4%** on the $120 pack and **100.55%** on the Diamond pack. That is sloppy, and it erodes trust.
- Diamond pack: $1,000 pack, floor $300, biggest win 52x, Grail 0.01%.

## 6. Open / reveal flow (seen: US demo video, 14 s, frames `09`, `10-*`)
- Black screen: "Tap to start" with a "Skip" button bottom-right that stays visible the whole time.
- Video (14.0 s, with an audio track): dark stone forge (0–1 s), then **blue flames ignite** (2–3 s; the flame colour is the tier tease), then a glowing ingot, then a hammer with a molten floor (5–8 s), then a white burst (9 s), then a **shield with 2 stars + mascot** = tier reveal (10–12 s), then a white flash into the card.
- Separate themed reveals per pack ("流鏑馬" yabusame, "新パック" etc.). JP "演出詳細を見る" (see reveal details) lets you preview them. JP fine print says the reveal does not guarantee the tier.

## 7. Rewards
- JP rank ladder (`06-jp-rank-up-perks`): gauge fills with points spent, **resets on the 1st of each month**, with a "keep line" to hold your rank. Bronze unlocks a daily bonus gacha (100–500 pt), a "Jackpot festival" ticket on the 1st, 11th and 21st, and bonus points on every top-up.
- JP: "new member only" packs, "時間限" (time-limited) packs, a ranking tab, a win-history tab, LINE coupons.
- US: "Daily Reward" wheel, which requires linking Instagram; first spin $0.01 (unverified: deadspin/grailcodes). Leaderboard and Winning Reports in the menu (menu items seen). Referral codes in UGC ("use this code and get a free pack").

## 8. Vault, shipping, buyback
- "Ship hits, trade the rest": unwanted cards **convert to credits at "100% market value"** (US App Store). Credits cannot be cashed out (purchase terms, seen).
- US shipping (unverified: FAQ via search): $20 under $10 shipped value, $15 under $30, $10 under $100, free at $100+.
- JP (unverified: oripa-guide.jp): free domestic shipping via Yamato, 1–3 business days, max ~30 items per request. **Items not requested for shipping within 3 days auto-convert to points.**
- Purchase terms: crypto payments may be accepted, refunds at their sole discretion.

## 9. Sign-up wall + onboarding
- Browsing, odds and the demo are all open. Buying needs an account (JP "新規会員登録してガチャる" = sign up to pull). Google One-Tap on landing.
- Onboarding hook: "2 free $2 packs" (US) and up to 90% off the first top-up (JP).

## 10. Trust signals
- 4.8★ from 3.6K ratings (US App Store, rated 13+ "simulated gambling"). JP app 4.4★ from 34K (search).
- Live pulled/shipped feed, livestream tab, UGC carousel, "Direct from Japan · handled and packed by our team", PSA slabs, LINE@ support with a pack ID to quote.
- Negative: App Store reviews call it "like a slot machine" and flag surprise shipping fees. One testimonial on their own homepage is tagged **#gambling** ("Turn $20 into $400").

## 11. Visual style
- JP: white base, red CTA (~#E8344E), rainbow-gradient anime banners, very busy. Feels like pachinko.
- US: near-black #111315, white text, accent blue #0686FF, Inter, rounded cards, tier colour chips (Grail yellow, 1st green, 2nd blue). Clean and premium. The reveal video is high-production 3D.
- Great: the remaining-tickets bar, the tier-coloured card grid, the sticky Try Demo / Buy bar.
- Bad: odds that add up to more than 100%, "Biggest win 52x" framing, the monthly rank reset, and auto-convert after 3 days.

## 12. Ideas for Blind Box
- **Copy "Try Demo"**: a free demo open on every box page using the real reveal. It works with no account (seen) and is the best pre-sign-up hook here.
- **Copy the remaining-stock bar** ("12 / 40 left on the shelf") on each tier, plus a per-piece "x left" count. It fits our live stock shelf (JP `03`, `04`).
- **Copy the tier-tease reveal**: colour of the glow/flame hints at rarity before the full reveal, with Skip always visible (`09`).
- **Copy the "Pulled / Shipped" live feed.** Shipped proof matters more for physical figures.
- **Copy the tier-badged piece grid** (Grail / 1st / 2nd) with % per piece.
- **Avoid**: odds that don't add up to 100%, "Nx win" and "floor value" money framing, credit buyback, auto-converting unclaimed prizes, rank resets, Instagram-gated daily rewards.
