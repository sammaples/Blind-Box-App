# PackDraw — hands-on notes (2026-10-03, iPhone 14 Pro viewport, logged out)

## 1. Access
- packdraw.com/en-us loaded fine, no bot wall. No account created, no money.
- Saw: landing, menu, pack listing, pack detail + odds, **demo open (played it)**, battles (empty when logged out), deals, draw, events (raffle/races), rewards, FAQ, fairness page, terms, signup modal.

## 2. Landing + pack listing
- Hero "Virtual Packs. Real prizes." Big stat strip: "$500M+ paid out", "7K+ items shipped", live packs-opened counter (75.5M), "260K+ players" (01-landing).
- Grabs you with a "$350,000 Lamborghini — Unboxed · it's yours" card.
- Listing (02): 2-col grid of tall foil-pack cards, price under each. Filters: Official / Price / **Volatility** / Price Range, plus **"Create Pack"** (user-made packs).
- Hamburger menu: Packs, Battles, Deals, Draw, Events, Rewards (01c).

## 3. Tiers + prices
- No fixed tiers. Packs from about $1.15 (landing "New Packs") up to about $20,052 (top of the high-to-low sort). Deals catalogue holds 8,768 products, up to $350k (cars and watches).

## 4. Pack detail page (03, 03-full)
- Top: a horizontal reel of item images with ▼▲ pointer markers. Below: qty −/x1/+, three icon toggles (fast/quick spin etc.), green "Open for $2.19", grey "Demo".
- Then the pack name, "18 Items", and a 2-col grid of item cards.

## 5. How odds are shown (04)
- Every item card shows **% at the top (4 decimals)**, image, name, value. Sorted by value.
- Example "Pokemon 30th Rip" $2.19: 3 × $7,000 Mew cards at 0.0005% each … **97.8975% = "Pokemon Card Back" $0.50**.
- My EV calc from shown odds: about $1.95 per $2.19 open (about 89%). So 98% of opens return 23% of the price.
- Fairness page: server seed + client seed + nonce → ticket 1–1,000,000, mapped to per-item ticket ranges "visible in pack details"; battles use a future EOS block hash (08b).

## 6. Open/reveal flow (05 frames 1–4, demo)
- Demo needs no login. Tap Demo → reel slides sideways (CS:GO-case style). Items glow (red glow on rare packs) and the reel decelerates under the centre pointer.
- About 3.5 s from tap to stop. Result: name + price caption under the centre card ("Pokemon Card Back $0.50"). No modal, no confetti on a loss. Buttons grey out during the spin.
- Terms: "the pack purchase animation is exclusively intended for illustrative purposes, and the Item(s) depicted therein may not invariably correspond to the Item(s) that you have indeed revealed."
- Sound: not observable headless.

## 7. Rewards
- Rewards page (07): Daily / Weekly / Monthly "bonus for playing" (Login to Claim) + **Free Packs at Level 2, 10, 20 … 100**.
- Levels come from XP bought with packs; terms say XP itself can count as "value" received from a pack.
- Events (07d): Daily Raffle $2,500 (spend $1+ for tickets, 20 winners/day), Weekly Race, Monthly Race.
- Battles: PvP same-pack opens, winner takes all; you can "summon a bot" (FAQ). Jackpot mode too.
- Deals (07b): pick any product, slide your win % (price scales), demo available. **Draw** (07c): card-flip multiplier ladder x1→x150 with survivability % (100% → 32.3%), Easy/Med/Hard.
- Affiliates: commission tiers on a dashboard (terms §8). Promo "+5% first deposit, code PACKDRAW".

## 8. Vault, shipping, cash-out
- Items sit in your account. Ship them, or "withdraw its value in crypto instantly".
- Terms: physical delivery **only US (minus some states) + Canada**; everyone else must exchange for crypto. Delivery costs shown at checkout; customs on the user.
- Item value = value **at the moment you redeem/exchange**, not when won (floating).
- Must wager the full deposit before any withdrawal. All pack purchases are non-refundable.

## 9. Sign-up wall + onboarding (09)
- Logged-out users can browse everything and run Demo. Opening for real needs an account.
- Modal: Google or email+password, **18+ attest checkbox** with ToS link. Clean and short.

## 10. Trust signals
- Big paid-out/shipped counters (self-reported). Provably-fair page with code. Company: Packdraw Ltd (Cyprus HE 445177) + PackDraw US LLC (Delaware); Florida law; JAMS arbitration + class-action waiver.
- No licence shown. Support only by email. Social: X, IG, YouTube.

## 11. Visual style
- Very flat dark UI: bg **#1D2125**, cards slightly lighter, CTA green **#48BB78**, primary blue about #4299E1, demo grey **#34383C**. Font **Urbanist**.
- Pack art does all the heavy lifting (foil packs, luxury collages). Watermarked "PackDraw" diagonal pattern behind the reel.
- Great: calm, readable, fast, pack art pops on a neutral background. Bad: very "casino lobby"; luxury-car bait; a loss reveal has no emotional beat.

## 12. Ideas for Blind Box
- COPY: **free Demo open with no login** (05) — the best taste-before-pay hook seen. Blind Box could let people demo-spin a tier with a "demo" watermark.
- COPY: odds on every item card at a fixed position (04). Keep ours, but also show "chance of beating box price".
- COPY: the volatility filter (02) maps well to our tiers (Bronze = low volatility, Diamond = high).
- AVOID: 97.9% filler outcomes ($0.50 card back in a $2.19 pack). Our live-stock shelf with real figures in every pull is a selling point; say so.
- AVOID: "animation is illustrative" disclaimers. Our reveal must show the actual server-drawn piece.
- AVOID: crypto cash-out, battles vs bots, raffles, the Draw multiplier — pure gambling loops, against our no-sell-back stance.
- CONSIDER: levelled free packs (07) → our daily spin + coin streaks could add level milestones that grant a free Bronze spin, with no deposit link.
