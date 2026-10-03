# Collector Crypt — hands-on notes (2026-10-03)

## 1. Access
- collectorcrypt.com: the landing page loaded (slow; page load timed out but rendered). /gacha and /marketplace on the main domain show "PAGE NOT FOUND".
- The real gacha is at **gacha.collectorcrypt.com**. It loads without login (~20 s to hydrate). No bot wall.
- Captured: machine, pack info + odds, recent openings, card pool, leaderboard, Gachadex League (data didn't load), sign-in modal.
- Public JSON the page itself loads (`/api/gachas/all`, `/api/status`, `/api/getRecentWinners`, `/api/chat/history`) gives all machine settings. Saved as `gacha-odds-2026-10-03.csv` (open machines only).
- Docs: docs.collectorcrypt.com (gacha API + VRF). Jupiter Gacha docs. Bitquery investigation. CoinGecko/Bitget explainers.
- I did NOT connect a wallet or sign in, so I saw no live reveal. The machine video (10 s) is only an idle loop.

## 2. Landing + pack listing
- Landing: "Like **Fort Knox**, but with a marketplace". Three pill buttons: VIEW MARKETPLACE · TOKENOMICS · GACHA. Pitch: "vault, trade, even collateralize your assets for loans". It's crypto-first.
- Gacha page: header icons (leaderboard, store, Sign In). Category chips: All / Pokemon / Others / One Piece / Sports. A horizontal list of machine codes (PKMN 50, PKMN 5000, … SOCCER 100). One big 3D **"Gacha Machine"** render (Japanese "ガチャガチャ" sign, graffiti decals, glass shelves of packs + slabs, glowing cyan output slot).
- A sticky bottom bar on every scroll: purple **"Sign In to Open"** + a **Turbo** toggle.

## 3. Tiers + prices
- Pokémon ladder: Starter $25 · Elite $50 · Bronze $100 · 151 & Friends $151 · Legendary $250 · Hyper $500 · Grail $1,000 · Mythic $2,500 · Celestial $5,000. Plus One Piece, sports, comics, watches, Dragonball, Riftbound, partner "exclusive" machines.
- 1 card per pull. Paid in USDC on Solana (card/Coinflow on-ramp also loaded).
- Each tier has its own buyback %: **85%** ($25/$50), **90%** ($100–$500), **93–94%** ($1k+ and partner packs). Bigger spend means a better buyback.

## 4. Pack detail (one panel per machine, under the machine)
- "✓ Guaranteed Authenticity". Pack name. A box on the right with **"$54.83 Expected Value"** (Elite $50, so EV = **110% of price**).
- "Free packs 0" ring + gold "Connect Wallet" + "100,000 points until next free pack".
- 3 stats: Pack contains **1 Card** | Instant buyback offer **85% of value** | Big win chance **20%**.
- Then "Recent Openings" (live feed) and the **card pool**: every card as a slab photo + "Insured value" in USDC + grade, sorted high→low. Highlight tags: TOP, GEM-MT 10, LANDED, VINTAGE.

## 5. How odds are shown
- Plain emoji list under "Statistics:" (04-odds):
  - 🟡 Common ($30–60, 80%) · 🟢 Uncommon ($60–110, 15%) · 🔵 Rare ($110–250, 4%) · 🔴 Epic ($250+, 1%)
  - "Pricing data is taken from ALT, eBay and other platforms…"
- Every machine uses the same weights: 80/15/4/1 ("big win 20%") or 75/20/4/1 ("big win 25%"). Only the $ bands scale with price.
- EV is live: `getWeightedInsuredValue` gives the pool-weighted average.
- Provably fair: an ECVRF roll from your wallet signature picks the tier, then a Feistel shuffle picks the card. Anyone can verify at `/verify-selection/<memo>` (docs).
- Catch: EV is 110% at **insured value**, but cash-out is 85%, so the real return is about 94%. Bitquery measured **94.2%** paid back. 78% of wallets are net losers. (unverified: Bitquery)

## 6. Open/reveal flow
- I couldn't see it: you must sign in before you can open.
- Machine video (`pokemon_50` HEVC, 10 s, **silent**) is an idle loop of the machine with a subtle glow (05 frame).
- Per the docs: a pack is generated, you sign, the VRF picks a tier, the NFT goes to your wallet, then you have 72 h to sell back. Unopened packs expire in 2 h.
- **Turbo toggle**: auto-sells Common pulls for USDC instantly and only hands you Uncommon+ (docs). That speeds the loop up a lot.
- A live chat posts system messages like "🏆 Epic Win … pulled by 63mV…" and "🎰 Machine is ON FIRE…".
- Skip button: unknown.

## 7. Rewards
- **Points**: each machine has a points multiplier (×0.5 at $25 up to ×100 at $5k). "100,000 points until next free pack". Free packs only on some machines (`freeSpins:true`).
- **Leaderboard**: All Time / Month / Week / Day / Hour, filter by pack, sort by Primary / Secondary / Bonus points / **Referred Accounts**. Rows are raw wallet addresses with points in the billions (#1 = 1.39 B).
- **Gachadex League**: "Trainers ranked by unique Pokémon caught. Tap one to see their badges & Gachadex." A set-collection meta. List didn't load for me.
- Referrals: counted on the leaderboard. "PartyYolo" route exists (empty page).
- $CARDS token / airdrop around it (unverified: CoinGecko, AirdropAlert).

## 8. Vault, shipping, buyback
- Cards are graded slabs stored at PWCC (Tigard OR), ALT, "OmniVault". Insured, and each is tokenised as a Solana pNFT (metadata shows vault + location).
- Instant buyback: 85–94% of insured value, paid in USDC, within **72 h** (docs; Jupiter docs say 3 days).
- Redeem: burn the NFT, then the vault ships it. **2% vault withdrawal fee** on insured value + shipping & handling (unverified: CoinGecko/Bitget).
- Marketplace: 2% fee on sale (Jupiter docs). You can also borrow against cards.

## 9. Sign-up wall
- Browse, odds and pool are all open. Any open needs "Sign In to Open".
- Modal "Log in or sign up": email, Google, Apple, More options (wallets), "I have a passkey". Protected by Privy. Gold "Connect Wallet" button on the pack panel too.
- No age gate seen before the modal.

## 10. Trust signals
- Full card pool visible with real slab photos and insured values.
- Provably fair VRF with a public verifier. On-chain ownership. Named vault partners (PWCC, ALT).
- Live "Recent Openings" + chat.
- Against it: wallet addresses as usernames. Crypto/loan framing. "Machine is ON FIRE" hype. Bitquery story on losses.

## 11. Visual style
- Background `#13131a`. Cards `#27272a` / `#1d1f29`. Muted text `#6b7a99`. Light text `#e5eeff`. Gold button `#e1b052` (Connect Wallet). Purple CTA (~`#8b2be2` → violet gradient). Brand orange + cyan cube logo. Font **Inter**.
- Great: the 3D gacha machine is a strong hero with real personality. The 3-stat strip (contains / buyback / big-win) reads instantly. The sticky CTA is always in reach.
- Bad: one long page with ~80 machines, so it's hard to find the panel for your pack. Odds are a plain emoji text list. Leaderboard is unreadable (44-char addresses, billions of points). Main site 404s on /gacha.

## 12. Ideas for Blind Box
- **3-stat strip on each box** (03): "1 figure · Ships in vault bundle · Chase odds X%". It's quick to scan; copy the layout, not the buyback stat.
- **Show the whole shelf as a sorted grid** with photos and a tag (TOP/CHASE) (04b/04c). We already have live stock, so put it right under the open button.
- **Gachadex-style collection meta** (06b): badges for collecting a full series/colourway. It's a strong retention hook that doesn't need cash-out. Fits Bearbrick sets well.
- **Sticky bottom "Open" bar** (02). Good for a one-thumb iPhone flow.
- **Provably fair / verify link** (docs). We could publish a per-draw receipt (seed hash + piece ID) for trust.
- Avoid: **Turbo auto-sell**, buyback % that rises with spend, points multipliers that reward bigger spend, "Machine is ON FIRE" chat, and EV shown at insured value when cash-out is 85%. These are the mechanics behind the Bitquery loss data. Sam's no-sell-back model avoids them; make that a visible promise.
- Avoid wallet/crypto language and raw IDs. Use friendly usernames and plain $.
