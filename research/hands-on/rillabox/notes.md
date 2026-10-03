# RillaBox — hands-on notes (2026-10-03, iPhone 14 Pro viewport, logged out)

## 1. Access
- rillabox.com loaded fine (one Cloudflare challenge sub-request was blocked by our proxy, but the page worked). No account, no money.
- Saw: landing, box listing, 1% iPhone + **Bearbrick** box pages, odds, **demo open (played it)**, VIP, weekly race, achievements, battles, help FAQ, shipping policy, free-box popup, signup modal. /reward just spins forever when logged out.

## 2. Landing + box listing
- Landing (01): gorilla-mascot hero carousel "WIN PRODUCTS FROM YOUR FAVORITE BRANDS", promo banner "Use code ACHIEVE for 15% Bonus", game tiles (Mystery Boxes, Battles, Upgrader, Crash, Plinko), live-drops ticker, user counter (1,426,217 users / 6,921,546 boxes opened), YouTuber "Real Wins" videos.
- Bottom tab bar (Live Drops / Games / Boxes) — app-like on mobile.
- Listing (02): category chips (All, New, Budget, Clothing, Sneakers, Tech, Gaming, Womens, Cars, Collectibles, Watches), sort + search, 2-col cards: 3D box render, **struck-through "was" price + purple sale price**, red "SALE" ribbons, a volatility bar under each.

## 3. Tiers + prices
- 334 boxes. Sale prices from **$0.19 ("Junkyard")** to **$14,899.99 ("High Roller")**, median about $24.
- "1%/5%/10%" naming for odds-to-hit (1% iPhone $2.79, 5% iPhone $9.99, 10% iPhone $48.99).
- **Bearbrick box $54.49** (03b) — a direct competitor to Blind Box.

## 4. Box detail page (03, 03b)
- Header: Back, box thumbnail + name, sound toggle. Big stage with ▼▲ pointers, reel of glowing items.
- "100% Authentic & Secured by Provable Fairness" shield line. Green "Open for $X", qty chips 1–4, DEMO, ⚡ quick-open, spinner icon.
- "Drops in <box> (N)", then item cards, then "Similar Boxes".

## 5. How odds are shown (04, 04b, 04c)
- Item card: rarity-coloured top/bottom border (gold > purple > blue > green), name, image, **value in a big purple pill**, **odds in small grey text bottom-right** (4 decimals). Value is loud, odds are quiet.
- Bearbrick box (41 items): 1000% Readymade Mickey $11,499.99 at 0.0027% … **19.9% = "Bearbrick Handheld Mini Fan" $8.99**. 14–18% each for opened Series 44/47 100% blind-box figures ($11.99–$22.49).
- My calc from shown values/odds: Bearbrick EV about $53.20 per $54.49 open (97.6% of price), but **84% of opens are worth less than the price**.
- 1% iPhone: iPhones total 1.13%. Shown EV about $7.41 vs the $2.79 sale price (odd; the "was" price is $20.29). 81.6% of opens land on a $0.59 or $0.05 sticker.

## 6. Open/reveal flow (05 frames 1–5, demo)
- Demo works logged out. Tap DEMO → a **3D cardboard box (box art) unfolds, flaps falling outward** (frame1). A horizontal reel then slides under the pointer, each item haloed in its rarity colour (frame2).
- Stops after about 3.5 s, centred on the result (frame3: Apple sticker $0.59). The box **folds back up over it** (frame4) and resets (frame5). Total about 6 s.
- No result modal in demo. Sound toggle in the header (audio not observable headless). Quick-open ⚡ button exists = skip.

## 7. Rewards
- Daily free box + level boxes (Level 5, 10, 15 …), claimable every 24 h. Levels go up with **wager volume** (FAQ, 07b).
- **RillaVIP** (06b): deposit-based tiers — Core $2,500/mo (up to 5% lossback), Elite $7,500/mo (10%), Prestige $100k/yr (15%), Legend $250k/yr (up to 25% lossback). Weekly reward boxes "up to $10,000", 1-1 host, IRL gifts.
- Weekly **$10k race** leaderboard (06c). **Achievements, Season 5** (06d): "Open the Starter box 3 times", "Bet $5+ on 1 crash round", refreshes in 8 days.
- Battles (06e): e.g. 5-round, $574.05, 1v1v1v1, Watch button. Plus Upgrader, Crash, Plinko.
- Referral: 5% commission on referred deposits over $25. Signup: "Sign Up & get Free Box" (Starter box).

## 8. Vault, shipping, cash-out
- Inventory → "Ship Items" → pay a **flat fee** (by location/items; amount not published). Need enough balance to cover the fee.
- Shipping policy: after you pay, **TechNexus "proceeds to order the products"** from partners (drop-ship; no held stock). 7–21 working days US/UK/EEA, 12–28 elsewhere. Customs on the user. **Not responsible for lost/damaged items.**
- "Exchange Unwanted Items" for instant credit, "no fees". Crypto withdrawals need $25+ deposited, the **full deposit wagered**, $25 minimum, no bank withdrawals. All sales final.

## 9. Sign-up wall + onboarding
- Full-screen "WAIT… CLAIM YOUR FREE BOX! SIGN UP NOW!" popup fires on almost every page (08). It's dismissible but nags.
- Signup modal (09): username, email, password, referral code, **"I want to receive promotional emails" pre-ticked**, ToS checkbox, reCAPTCHA, Google/FB/X social.

## 10. Trust signals
- "100% Authentic — verified from StockX or official retailers", provably fair (server/client seed), YouTuber win videos, live drops, user counters.
- TechNexus Ltd, Cyprus HE 449023. Support by email + Telegram. No licence shown. Payment: cards + crypto.

## 11. Visual style
- Deep navy/indigo: header **#0E0E1F**, cards **#191B2C**, primary **#676CF6** (periwinkle), green CTA about #1DC93E, acid-lime promo accents, font **Poppins**.
- Gorilla mascot + chrome logo, 3D rendered boxes. Great: the box-unfold reveal is tactile and branded per box; rarity colours read instantly; the bottom tab bar feels native. Bad: aggressive popups, SALE ribbons on everything, fake-feeling "was" prices, VIP "lossback" language, casino games one tap away.

## 12. Ideas for Blind Box
- COPY: **3D box-unfold → reveal** (05 frame1). Our Bronze/Silver/Gold/Diamond boxes should physically open; the per-tier box art is the hero.
- COPY: rarity-colour borders/glows (04b) mapped to our tiers/piece rarity. Instant, needs no reading.
- COPY: demo open logged out + mobile bottom tab bar.
- DIFFERENTIATE: RillaBox drop-ships after you pay shipping (no stock held, 7–28 days, lost = your problem). Blind Box's **live stock shelf + Vault + one flat postage** is a real trust edge. Show "in stock, ships from us" on every piece.
- DIFFERENTIATE: their Bearbrick box is 84% "below price" with 20% chance of a $8.99 fan. Publish our "every pull is a real Bearbrick-style figure" plus the floor value per tier.
- AVOID: pre-ticked marketing opt-in, recurring signup popup, strike-through "was" prices, deposit-tier lossback, crash/plinko — all UK/EU regulator red flags.
- AVOID: odds in tiny grey text. Keep odds as prominent as value.
