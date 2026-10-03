# Ichiban Kuji ONLINE (BANDAI SPIRITS) — hands-on, 2026-10-03

Official online version of the Japanese convenience-store lottery. Finite ticket box, fixed prize tiers A–J, and a "Last One" prize for whoever draws the final ticket. Site: `on-line.1kuji.com`. Info site: `1kuji.com`.

## 1. Access
- Home page, product list, product detail, "初めての方へ" (first-timer guide) and FAQ all loaded with no login and no bot wall. A OneTrust cookie modal covers the page, so I hid it with CSS for the screenshots.
- Not opened: tapping "購入する" (buy) to reach the box-selection screen. That is the step that leads into a purchase, so I skipped it. Box selection, the queue and the reveal are described from the official guide illustrations (`03`, `03b`, seen) plus Japanese how-to blogs (unverified: gamepedia.jp, tanakini.hatenablog.jp, Yahoo Chiebukuro).

## 2. Landing + listing
- `02-online-top`: free-shipping campaign banner (9/1–10/9), tabs **販売中 / 販売予定** (on sale / coming soon), then a **full-screen vertical swipe feed**, one kuji per screen, with a "上にスワイプしてさらに表示" (swipe up for more) coach mark. TikTok-style browsing.
- Bottom bar: Login / Sign up / News. Top bar: Product list / First-timer guide / menu.

## 3. Tiers + prices
- One price per kuji, not per tier: **1 pull = ¥550 (mini "ちょこっと") to ¥1,450**. Most are ¥700–¥900 (seen in the listing).
- Max **30 pulls per payment** (seen, `04b`).
- Prize tiers A to J. A–F are figures (1 kind each, 7–27 cm). G–J are small goods ("選べる" = you pick the variant, or "選べない" = random variant). Then **ラストワン賞 (Last One)** and **ダブルチャンス** (Double Chance, a mail-in raffle for the same Last One figure).

## 4. Product detail page (`04`, `04b`, `05`, `06`)
- Hero art with a floating orange round **"購入する"** FAB that stays on screen while you scroll.
- Info block: release date/time, price per pull, **shipping ¥660 + "送料おまとめ対象" (eligible for bundled shipping) with a ? tooltip**, age 15+, a red "read before buying" accordion, "buy in store instead" link, **ships in about 10 business days**.
- "等賞一覧" (prize list): a big photo for each tier with tier pill, name, number of kinds, size, and an expandable description. The Last One figure is shown the same way (`06`).
- Fine print: random-variant tiers do not guarantee a full set in one box.

## 5. How odds are shown
- **No percentages.** Odds come from the finite box: each box has a known ticket count and per-tier remaining counts.
- Official guide step 3 "残り等賞を確認" (check remaining prizes) shows **"A賞 1/2"**, meaning remaining / original for that tier in the chosen box (seen in guide art `03`).
- Several boxes run in parallel. Each shows remaining tickets, remaining count per tier, and queue length (unverified: gamepedia). Users pick the box that still has the prize they want.

## 6. Open / reveal flow (unverified: official guide art + blogs)
- Pick kuji, then pick box (3D boxes with a hand cursor), then check remaining prizes, then choose quantity, then join the queue. When your turn comes the button turns from blue to red and you have **3 minutes** to tap it, then 15 minutes to pay.
- Then **pick your own tickets** from a grid of black ticket cards with the kuji logo (step 5). The ticket peels open with sound and animation. The prize appears with a ribbon banner "A賞" (step 6). A **"未開封をすべて開封" (open all unopened)** button skips the rest.
- Last One: drawing the last ticket in a box triggers the pink-ribbon "ラストワン賞" card (step 7).

## 7. Rewards / retention
- Last One prize. Double Chance raffle. "一番くじポイント" points and LINE link (FAQ keywords, seen). "買い増しチケット" (top-up tickets) and "送料無料チケット" (free-shipping tickets) are FAQ keywords. Favourite heart on each product.
- No daily spin, no levels, no leaderboards, no battles. The retention comes from the IP drops schedule (販売予定 tab) and the Last One hunt.

## 8. Vault, shipping, buyback
- **Bundled shipping (おまとめ配送)**: everything bought between 4:00 and 3:59 the next day ships together for one fee. If fees differ, the higher one applies. Pre-orders cannot bundle with in-stock items (search summary + gamepedia).
- Shipping ¥660 per order (¥330 for mini), with seasonal free-shipping campaigns. About 10 business days.
- **No buyback, no resale, no credits.** You get the physical goods, full stop.

## 9. Sign-up wall
- Everything is browsable. Buying needs a Bandai Namco ID. Payment page warns PayPay fails inside SNS in-app browsers and private mode.

## 10. Trust signals
- Bandai Spirits brand and licensed IP (copyright lines on every page). The finite box makes the odds verifiable. Accessibility widget. FAQ portal, business-day calendar, specified commercial transactions page.

## 11. Visual style
- White/light grey base, navy #0E0B71 buttons and bottom bar, red #F23041 accents, orange buy FAB, Noto Sans JP. Product photos do all the work. Functional, a bit dated, but clear.
- Great: the swipe feed, the floating buy button, one large photo per tier, plain shipping and ETA info right next to the price.
- Bad: no % odds on the product page, the queue system, the cookie modal covering half the screen.

## 12. Ideas for Blind Box
- **Copy "remaining / total" per piece** (like "A賞 1/2"). It matches our live stock shelf and is the most honest odds display: "Gold Bearbrick 2 of 5 left".
- **Copy the "Last One" prize**: whoever opens the last box of a shelf/series gets a bonus figure. It turns the end of a series into an event and suits finite stock (`06`, guide step 7).
- **Copy the bundled-shipping explainer** next to price ("ships with your Vault, one flat fee"), with a ? tooltip (`04b`).
- **Copy pick-your-own-box**: let users tap one box from a grid of sealed boxes before the server draw. It adds agency even though the result is still server-side.
- **Copy the "open all" skip** for multi-box opens.
- **Copy the "coming soon" drops tab** for series launches.
- **Avoid**: queues and 3-minute timers, and hiding % odds behind a purchase step.
