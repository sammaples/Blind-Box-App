# Card "Rip and Ship" and Vaulted-Collectible Platforms (2023–2026): Teardown for Blind Box

Research note on method: WebFetch was blocked by the network egress proxy for every domain tried (fortune.com, solanacompass.com, docs.phygitals.com, docs.courtyard.io, ripranks.com, investor.gamestop.com, cointelegraph.com, sportscollectorsdaily.com, shacknews.com). All findings below come from search-result snippets of the cited pages. Treat exact figures as "per snippet of source"; where a number comes from an affiliate review site (Deadspin "mystery boxes", TheSpike, TheLines, Strafe, Covers, etc.) it is marked as lower-confidence. Today's date is 2026-10-03.

## 1. How packs/draws work: price tiers, pool, odds/EV disclosure

### Takeaway
Every major player has converged on the same core: a "pack" = one pre-graded, vaulted card drawn at random from a disclosed pool, priced in tiers from roughly $10–$25 up to $2,500+, with odds shown as value bands (e.g. "48% chance of $50–$75") and an advertised EV near or slightly above pack price. Blind Box's four-tier, per-piece-odds design is squarely in line with this standard, and is in fact more transparent than value-band disclosure.

### Cited Findings
**Courtyard.io (NYC; Polygon NFTs)**
- Sells "mystery packs" through a digital vending machine: pay $25, $50, or $100 for an unknown Pokémon or sports card (or $200 for a comic), and "an algorithm randomly assigns them a card or comic" from inventory in its vault — [Fortune via EBSCO/Forerunner search snippet](https://fortune.com/2025/07/24/exclusive-forerunner-leads-30-million-round-in-collectibles-marketplace-courtyard/)
- Pokémon lineup now runs from a $10 "Basic Pack" to a $2,500 "Legend Pack" — [Courtyard blog: $10 Pokémon Basic Pack](https://courtyard.io/blog/post/introducing-the-new-10-pokemon-basic-pack)
- Earlier tiering: Starter Packs at $25 up to Platinum Packs at $500 — [Bankless](https://www.bankless.com/read/courtyard-cards-onchain). Affiliate reviews cite $25–$10,000+ — [TheSpike (affiliate)](https://www.thespike.gg/reviews/courtyard-io)
- Odds shown on pack pages as value bands; example: a $100 Master Pack has 48% odds of a $50–$75 card and a small chance of $800–$1,600; packs are described as having EV roughly equal to pack price — [Bankless](https://www.bankless.com/read/courtyard-cards-onchain) / search snippet aggregating Courtyard pack-page language
- A third-party site, PullValue, tracks Courtyard pack EV ratios and observed odds across tiers — [PullValue](https://pullvalue.io/)
- A "Gacha Machine" feature reportedly brought in $16M of revenue within seven days of launch — [Bitget news guide (aggregator)](https://www.bitget.com/news/detail/12560604953909)

**GameStop Power Packs (with PSA)**
- Launched in beta during GameStop's fiscal Q2 2025 (summer 2025; PSA tweet dated ~July 29, 2025): "Open mystery packs that contain a PSA-graded card, then decide whether to keep, store, or sell through Instant Buyback, via eBay, or receive PSA Offers from your PSA Vault" — [PSAcard on X](https://x.com/PSAcard/status/1950289445728485445); [GameStop 10-Q (Aug 2, 2025)](https://www.sec.gov/Archives/edgar/data/1326380/000132638025000075/gme-20250802.htm)
- General public launch April 15, 2026 at powerpacks.com; categories at launch Pokémon, Football, Basketball, Baseball (One Piece also listed); packs from $25 to $2,500 — [GameStop IR press release](https://investor.gamestop.com/news-releases/news-details/2026/GameStop-Launches-Power-Packs-for-Digital-Trading-Cards/default.aspx)
- GameStop publishes value-band distribution percentages per tier on powerpacks.com — [RoaringSensei Power Packs FAQ (fan guide)](https://roaringsensei.com/guides/power-packs-faq.htm)
- Native apps exist: iOS ([App Store](https://apps.apple.com/us/app/gamestop-power-packs/id6762152565)) and Android ([Google Play](https://play.google.com/store/apps/details?id=com.gamestop.powerpacks.v1&hl=en_US)). Numbered "Series" drops (e.g. Series 4) — one Series 4 Gengar pull reportedly resold for ~$30,000 — [Resell Calendar](https://resellcalendar.com/news/news/gamestop-power-pack-series-4-gengar-record-sale/)

**Collector Crypt (Solana)**
- Gacha launched December 2024 (first pull Dec 7); users spend CARDS token or USDC to open digital packs and receive a random NFT from a pre-minted pool; each NFT is 1:1 with a graded card in vaults operated by PSA, PWCC (Fanatics) and ALT — [Bitquery investigation](https://bitquery.io/investigations/collector-crypt-jupiter-gacha); [Solana Compass](https://solanacompass.com/news/collector-crypt-draws-40000-daily-users-as-solanas-consumer-app-layer-matures); [Cointelegraph](https://cointelegraph.com/features/pokemon-cards-as-rwas-gacha-spending-hits-records-as-crypto-sinks)
- Tiering example: early "Elite" packs at $50–$60 had ~20% "big win" odds with 85% buyback floor; "Legendary" packs at $250 had ~25% big-win odds with 90% buyback floor; rarity distribution reported as Common 75% / Uncommon 20% / Rare 4% / Epic 1% — [Bitquery](https://bitquery.io/investigations/collector-crypt-jupiter-gacha); [4Pillars](https://research.4pillars.io/en/research/collector-crypt-has-no-collectors)
- Advertised EV on the $50 Elite pack: $55.37 (~110%); all machines advertise positive EV (up to 110.7%) — [Bitquery](https://bitquery.io/investigations/collector-crypt-jupiter-gacha)
- White-label distribution: "Solflare Packs" (in-wallet, launched June 11, 2026, USDC) and "Rarible Gacha Station" (Pokémon, One Piece packs from $25) both powered by Collector Crypt; "Gacha Sports" launched June 2026 — [Solflare Packs](https://www.solflare.com/packs/); [Solana Compass — Rarible](https://solanacompass.com/news/rarible-gacha-station-goes-live-on-solana-powered-by-collector-crypt); [Genfinity](https://genfinity.io/2026/06/23/gacha-sports-collector-crypt-solana-flips-pump-fun/)

**Phygitals (Solana)**
- Digital packs of real Pokémon, Yu-Gi-Oh!, One Piece, NBA etc.; every card backed by a physical card in partner vaults (PSA, Alt, Fanatics); Pokémon has seven price points from $25 to $2,500 (Trainer, Mythic, Legend packs etc.); a "claw" machine product page exists — [TheSpike (affiliate)](https://www.thespike.gg/reviews/phygitals); [Phygitals /claw](https://www.phygitals.com/claw); [Phygitals docs – Packs](https://docs.phygitals.com/about-phygitals/welcome-to-phygitals-the-future-of-collecting/packs)
- Has tokenized 100,000+ cards across Pokémon, One Piece, sports and figurines — [FinanceFeeds](https://financefeeds.com/how-phygitals-is-bringing-real-world-collectibles/)

**Arena Club (LA; co-founded by Derek Jeter)**
- "Slab Packs": a digital pack reveals one real graded card; keep it, ship it, vault it, or take instant buyback — [Arena Club App Store](https://apps.apple.com/us/app/arena-club-sports-tcg-card/id6499444724); [CardsAI review](https://www.cardsaiapp.com/blog/arena-club-review)
- Physical Slab Packs sold weekly on eBay (exclusive online partner) from July 30, 2025: $250, 400 per series, one graded card from a "fully disclosed checklist", shipped from Arena Club's climate-controlled facility — [SI Collectibles](https://www.si.com/collectibles/arena-club-launches-weekly-slab-pack-drops-with-ebay-as-exclusive-online-partner); [Fox Business](https://www.foxbusiness.com/sports/derek-jeters-digital-trading-card-venture-makes-groundbreaking-partnership-ebay)
- Media-partner co-branded weekly drops: "Yahoo Fantasy x Arena Club" football and basketball Slab Packs (e.g. Week 24 chase: Cooper Flagg Prizm refractor) — [Yahoo Sports](https://sports.yahoo.com/fantasy/article/yahoo-fantasy-and-arena-club-launch-exclusive-weekly-slab-packs-featuring-top-fantasy-football-performers-120124320.html); athlete-exclusive packs (Giannis) — [SI](https://www.si.com/collectibles/arena-club-announces-exclusive-giannis-slab-pack)

**Fanatics (Fanatics Live / Fanatics Collect / Topps)**
- "Instant Rips" launched March 2025 inside Fanatics Live: livestream breakers open digital twins of graded cards stored in the Fanatics Collect vault; ownership transfers instantly; first product "Odyssey" = 1,000 baseball repacks at $250, one graded card each, value floor ~$90 and ceiling ~$3,800 — [Cllct](https://www.cllct.com/sports-collectibles/sports-cards/fanatics-enters-repack-market-with-instant-rips-1); [Fanatics Live blog](https://about.fanatics.live/post/introducing-instant-rips-the-future-of-breaking)
- August 2026: "Topps Instant Packs" — portions of select sealed Topps releases (starting 2025-26 Topps Chrome Black Basketball) ripped digitally in the Fanatics Collect app; "every card physically exists" — [Bleacher Nation](https://www.bleachernation.com/collectibles/2026/08/28/fanatics-and-topps-get-into-the-instant-ripping-business-with-instant-packs/); [Topps on X](https://x.com/Topps/status/2093066109217808626); [Fanatics Collect support: Instant Packs](https://support.fanaticscollect.com/en_us/instant-packs-HkFgg0pvGe)
- Fanatics Live "Debut Pack": first card free for new users — [Fanatics Live](https://www.fanatics.live/debut-pack)

**Coinbase (announced, not launched as of late Sept 2026)**
- Teased a mobile digital Pokémon pack-opening product, each card 1:1 with a physical card that can be vaulted or shipped; no launch date, prices, pull rates, fees or Pokémon Company partnership disclosed — [Dexerto](https://www.dexerto.com/pokemon/coinbase-jumps-into-pokemon-tcg-craze-with-digital-packs-backed-by-real-cards-3413480/); [Cryptonomist, Sept 29 2026](https://en.cryptonomist.ch/2026/09/29/coinbase-pokemon-card-packs/)

**Others**
- Vaultr: mystery packs of PSA-graded Pokémon, published odds, 90% buyback offers — [Vaultr](https://vaultr.pro/)
- PackDraw, Ripit, Rips by Triumph and similar "card rip" sites are marketed via sportsbook-style affiliate sites alongside "mystery boxes" for iPhones/PS5 — [Covers](https://www.covers.com/betting/card-rips); [Deadspin mystery boxes](https://deadspin.com/mystery-boxes/)

### Inferences
- Tier ladders typically span 100x–250x (e.g. $10/$25 → $2,500). Blind Box's $25–$250 (10x) is narrower and more mass-market; the $10 Courtyard "Basic" pack suggests a sub-$25 entry tier is a proven funnel.
- Industry odds disclosure is mostly value bands, not per-item odds. Blind Box publishing per-piece pull rates is a differentiator for trust.
- Advertised "EV ≥ pack price" is the dominant marketing frame; but because value is set against card comps and liquidation is at 85–90%, real returns are below 100% (see Q2). Blind Box, without buyback, cannot use the EV frame and should avoid implying cash value.

### Gaps
- Could not retrieve full current per-tier odds tables for Courtyard, Power Packs or Phygitals (fetch blocked).
- Arena Club digital Slab Pack price tiers not confirmed.

## 2. Instant buyback, trade-in, resale and how value is set

### Takeaway
Instant buyback at 80–93% of a platform-set "fair market value" is universal and is the economic engine: platforms recycle the bought-back card into new packs, earning the spread each cycle (Courtyard: same card sold ~8x/month). On-chain data on Collector Crypt shows ~90% of gross pack revenue flows back out as buybacks and players realise ~94% of spend, i.e. a ~6–7% house hold.

### Cited Findings
- **Courtyard**: immediate buyback at 90% of FMV (less fees) after reveal — [Sports Collectors Daily](https://www.sportscollectorsdaily.com/repack-marketplace-courtyard-io-picks-up-30m-funding-round/). Business model: "makes money when it buys cards back from customers for 90% of its value and resells it to customers in a new mystery pack. The same card is sold an average of eight times a month" — [Fortune (snippet)](https://fortune.com/2025/07/24/exclusive-forerunner-leads-30-million-round-in-collectibles-marketplace-courtyard/). Also runs a peer-to-peer marketplace (NFTs tradable on OpenSea etc.) — [Bankless](https://www.bankless.com/read/courtyard-cards-onchain)
- Courtyard user complaints: "84% buybacks"; "buyback guarantee coupons" where value is just above price paid; FMV of $100 vs ~$60 on TCGPlayer/eBay — [Trustpilot](https://www.trustpilot.com/review/courtyard.io); [Google Play reviews](https://play.google.com/store/apps/details?id=io.courtyard.app&hl=en_US)
- **GameStop Power Packs**: Instant Buyback at 90% of Card Ladder value minus a 6% selling fee ≈ 84.6% net; 7-day window from pack opening; alternatives are PSA Offers (from the PSA Vault) or listing on eBay — [Kokutech calculator](https://www.kokutech.com/blog/other-stuff/gamestop-power-packs); [RoaringSensei sell guide](https://roaringsensei.com/guides/how-to-sell-your-power-pack-card.htm); [PSAcard on X](https://x.com/PSAcard/status/1950289445728485445). Sale proceeds can be used to buy more packs — [Dexerto](https://www.dexerto.com/pokemon/coinbase-jumps-into-pokemon-tcg-craze-with-digital-packs-backed-by-real-cards-3413480/)
- **Phygitals**: buyback 85–90% of FMV depending on tier; 30-minute window after opening — [TheSpike (affiliate)](https://www.thespike.gg/reviews/phygitals); [Phygitals FAQ](https://docs.phygitals.com/help/frequently-asked-questions). April 2026 integration lets Phygitals sellers list on Fanatics Collect — [Genfinity](https://genfinity.io/2026/04/27/phygitals-fanatics-collect-solana-tokenized-trading-cards/)
- **Collector Crypt**: instant buyback 85–90% of indexed value, higher on higher tiers; "Turbo mode" auto-sells at 93% — [Bitquery](https://bitquery.io/investigations/collector-crypt-jupiter-gacha); [4Pillars](https://research.4pillars.io/en/research/collector-crypt-has-no-collectors)
- Collector Crypt on-chain economics: of $635M all-time gross revenue, 90.6% returned as instant buybacks → $43M net revenue (6.7% hold); net margin fell from 11.2% to 5.8% as volume shifted into high-tier packs; secondary trading (eBay + P2P) under $5M total; eBay share of gacha flow fell from 1.23% to 0.10% over six quarters — [4Pillars "Collector Crypt Has No Collectors"](https://research.4pillars.io/en/research/collector-crypt-has-no-collectors); [HTX news summary](https://www.htx.com/news/cards-brutal-truth-of-535m-fdv-only-43m-net-revenue-profit-m-NAJ9rmS2/)
- Bitquery: $622.6M wagered across 17,544 wallets (Dec 7, 2024 – July 13); realised payout 94.2% vs advertised EV up to 110.7%; 78% of wallets net down; median player −$50; whales >$100k spend averaged −$41,302; only <$50 spenders averaged positive; once 85–93% buyback is priced in, every machine's EV flips to −5.2% to −7.0% — [Bitquery](https://bitquery.io/investigations/collector-crypt-jupiter-gacha)
- **Arena Club**: buyback reported variously as 80% or 90%; one version is an add-on where paying ~10% more for the pack guarantees the right to sell for 80% of pack price — conflicting, reported by review sites — [PackRipping](https://packripping.com/reviews/arena-club); [10kcardjourney](https://10kcardjourney.blog/2025/01/22/arena-club-slab-packs-a-fun-rip-but-are-they-worth-it/); [Deadspin (affiliate)](https://deadspin.com/mystery-boxes/arena-club/)
- **Fanatics Collect**: no instant buyback found; resale via Fanatics Collect marketplace; sellers choosing FanCash payout get 100% of sale price (commission/processing waived) — [Yahoo Sports](https://sports.yahoo.com/articles/fanatics-collect-waives-seller-fees-140054220.html)
- **Vaultr**: 90% buyback offers — [Vaultr](https://vaultr.pro/)
- Value sources: Card Ladder (Power Packs), "real-time indexed value" (Collector Crypt), platform FMV (Courtyard), PSA Offers — sources above.

### Inferences
- Buyback is what turns these products into "near-cash" loops — and what makes them look like gambling (see Q7). The NY AG v. Valve theory explicitly targets "paid randomized openings with a cash-equivalent exit." Blind Box's no-sell-back, reward-only-coins design removes the cash-out leg; this is the single most important regulatory distinction from every platform here.
- The buyback flywheel also explains platform economics: thin per-pull margin (~6–7%) at enormous velocity. Blind Box, selling figures outright, earns full retail margin per box but has no recycling of inventory — stock shelf depletion and restocking cadence will matter more.
- Players heavily choose instant liquidation over collecting (Collector Crypt <1% eBay flow). Expect Blind Box users who would have wanted cash-out to churn; those who stay are the "collect and ship" segment.

### Gaps
- No primary-source buyback percentage for Arena Club; reports conflict.
- Courtyard's exact current fee on buyback not confirmed (users report effective ~84%).

## 3. Vault: storage, insurance, fees, redemption/shipping, tokenization

### Takeaway
Vault storage is free almost everywhere; the friction and the money are at withdrawal: a per-item handling fee ($1–$4.99 or 1–3% of value) plus postage, with batching (PSA: up to 50 cards per $5.99 US shipment) the closest analogue to Blind Box's "ship together for one flat postage." Shipping cost is the #1 recurring complaint.

### Cited Findings
- **PSA Vault (Collectors; used by GameStop Power Packs, eBay)**: free storage, climate-controlled, insured, New Castle, Delaware; withdrawal $1.99/item after 90 days or $4.99/item early, plus $5.99 per US shipment (up to 50 cards) — [CardGrading.app / comparison snippets](https://cardgrading.app/card-vaulting); [PSA Vault](https://www.psacard.com/info/psa-vault). For Power Packs specifically: $1.99/item base withdrawal fee + $5.99 US / $24.99 Canada / $31.99 international; up to 50 cards per shipment; no annual storage fee; cards can stay indefinitely — [RoaringSensei shipping guide](https://roaringsensei.com/guides/how-to-ship-your-power-pack-card-home.htm); [RoaringSensei PSA Vault guide](https://roaringsensei.com/guides/psa-vault-how-it-works.htm)
- PSA/Collectors acquired the eBay vault (and Goldin) — PSA Vault is eBay's official vault — [Sports card vault comparison snippets](https://showvault.net/blog/psa-vs-alt-vs-fanatics-vault-features-compared)
- **Fanatics Collect Vault (ex-PWCC)**: free vaulting for cards ≥$50 ($3 otherwise); withdrawal fee 3% of insured value within 90 days of curation, 1% after; plus standard FedEx/USPS shipping and insurance (~$5–10); vault shipping turnaround tightened to 24–48 hours — [Fanatics Collect support: Retrieve items](https://support.fanaticscollect.com/en_us/retrieve-items-from-the-vault-H18TQRmTxe); [Fanatics Collect FAQ](https://support.fanaticscollect.com/frequently-asked-questions-r1I0QA7plg); [Yahoo Sports](https://sports.yahoo.com/articles/fanatics-collect-waives-seller-fees-140054220.html)
- **Alt Vault**: temperature-controlled, 24/7 monitored; sell fees 5–14%; withdrawal 1% capped at $100; still operating (Crunchbase "Active"); no Alt-branded packs found — [Alt support: The Alt Vault](https://support.alt.xyz/en/articles/9213530-the-alt-vault); [Alt Vault Fees](https://support.alt.xyz/en/articles/9213538-vault-fees); [Crunchbase](https://www.crunchbase.com/organization/alt-xyz)
- **Beckett Vault**: in Beckett's 100,000 sq ft Plano, Texas facility; climate-controlled, insured, biometric access, launched with zero storage fees — [Sports Collectors Digest](https://sportscollectorsdigest.com/news/beckett-vault-sports-card-collectibles-storage). Collectors (PSA parent) agreed to acquire Beckett on December 15, 2025; Beckett to remain an independent brand; Rep. Pat Ryan urged FTC to investigate Collectors' Beckett and SCG acquisitions — [Collectors announcement](https://www.collectors.com/company-announcement); [Cllct](https://www.cllct.com/sports-collectibles/memorabilia/psa-parent-company-collectors-acquires-beckett); [Value Added Resource](https://www.valueaddedresource.net/congressman-pat-ryan-ftc-collectors-beckett/)
- **Courtyard**: originally stored with Brink's; moved to its own "Courtyard Vault" in Delaware (Brink's described as built for gold/silver that rarely moves, unsuited to high-velocity collectibles); ships within 1–2 business days of a redemption request via FedEx at cost; Redemption Tracker; $2/card handling fee during high demand; KYC required to redeem; buyer pays shipping and taxes — [Courtyard blog: Introducing the Courtyard Vault](https://drops.courtyard.io/blog/post/introducing-the-courtyard-vault-adc65cca3c80); [Courtyard help: Redeem](https://intercom.help/courtyardio/en/articles/9513558-how-to-redeem-your-physical-collectibles); [Courtyard docs: Redemption & Shipping](https://docs.courtyard.io/courtyard/logistics-and-legal/asset-redemption-and-shipping)
- Courtyard tokenization: each card minted as an NFT on Polygon; redemption burns/retires the token — [Polygon blog](https://polygon.technology/blog/tokenization-spotlight-courtyard-io-puts-analog-collectibles-like-pokemon-cards-onchain)
- **Arena Club**: vault or pay to "retrieve"; ~$1 per card plus shipping — [PackRipping](https://packripping.com/reviews/arena-club); [Startupintros](https://startupintros.com/orgs/arena-club)
- **Collector Crypt / Phygitals**: NFTs on Solana, cards in PSA/Fanatics(PWCC)/Alt vaults; Solflare Packs give "on-chain title to the real physical card" — [Solflare Packs](https://www.solflare.com/packs/); [TheSpike – Phygitals](https://www.thespike.gg/reviews/phygitals)

### Inferences
- PSA's "one $5.99 fee for up to 50 cards" is the clearest market precedent for Blind Box's flat-postage bundle; per-item handling fees are where competitors draw complaints. A flat, all-in postage with no per-item fee would be a clear selling point.
- Fast ship SLAs (Courtyard 1–2 business days, Fanatics 24–48 h) are now the competitive norm.
- Blind Box does not need tokenization; non-crypto incumbents (GameStop/PSA, Fanatics, Arena Club) show ownership proof can be a vault record in an account, not an NFT.

### Gaps
- Insurance terms (coverage limits, who bears loss in transit) not retrieved for most vaults.
- Phygitals and Collector Crypt redemption fees/timing not confirmed (docs fetch blocked).

## 4. Reveal UX, apps, engagement loops (feeds, leaderboards, streaks, rewards, referrals)

### Takeaway
Courtyard is the most fully gamified: points on every pull, daily point claims, weekly quests, monthly real-time leaderboards with up to $1,000 prizes, timed event hunts ("The Amazing Chase" with $4.5K grand prize), raffles and referral points. Native apps rate well (4.5–4.8 on iOS) while Android ratings lag, and the lowest reviews cluster around odds and fees rather than UX.

### Cited Findings
- **Courtyard rewards**: every pull earns Courtyard Points redeemable toward packs; 5,000 points = $25 pack credit; up to 30 points/day via daily claim and vending machines — [Courtyard blog: More Ways to Earn Points](https://courtyard.io/blog/post/more-ways-to-earn-points-more-packs-to-rip); [Courtyard docs: Points](https://docs.courtyard.io/courtyard/resources/points)
- Courtyard monthly leaderboard updated in real time, prizes up to $1,000 grand prize; weekly quests; referral = 1,000 points when a referred friend buys a $25+ pack — [TheLines (affiliate)](https://www.thelines.com/card-rips/courtyard-io/free-pack/); [TheSpike (affiliate)](https://www.thespike.gg/reviews/courtyard-io/promo-code)
- Courtyard events: "The Amazing Chase: Daily Drops, Hidden Bounties, and a $4.5K Grand Prize"; "Five Days of Packs"; Pokémon Vintage Raffle with free PSA 10s — [Courtyard blog](https://courtyard.io/blog/post/the-amazing-chase-daily-drops-hidden-bounties-and-a-4-5k-grand-prize); [Courtyard blog](https://courtyard.io/blog/post/five-days-of-packs); [TheLines](https://thelines.com/card-rips/news/pokemon-vintage-raffle-win-psa-10-cards-for-free-at-courtyard-io)
- Courtyard app ratings 4.6 (App Store) / 4.1 (Google Play) — [TheSpike (affiliate)](https://www.thespike.gg/reviews/courtyard-io); app listing — [App Store](https://apps.apple.com/us/app/-/id6748155184)
- Courtyard runs on Privy embedded wallets so users need not manage crypto — [Privy blog](https://privy.io/blog/inside-the-stack-how-courtyard-is-reinventing-the-collectibles-marketplace)
- Power Packs app: 4.8/5 (465 ratings) iOS; 3.9 (123 reviews) Google Play; reviewers say the app is "much more responsive than the mobile browser version"; negative reviews cite "horrible" odds vs other apps and selling below market plus fees — [App Store](https://apps.apple.com/us/app/gamestop-power-packs/id6762152565); [Google Play](https://play.google.com/store/apps/details?id=com.gamestop.powerpacks.v1&hl=en_US)
- Arena Club app: 4.5 stars, ~6.3K ratings iOS; 4.4 Android — [App Store](https://apps.apple.com/us/app/arena-club-sports-tcg-card/id6499444724); [PackRipping](https://packripping.com/reviews/arena-club)
- Public "big pulls" content is a marketing channel: DraftKings Network publishes monthly "Courtyard.io biggest pulls" round-ups — [DK Network](https://dknetwork.draftkings.com/2025/04/03/courtyard-io-biggest-pulls-march-2025-shohei-ohtani-patrick-mahomes/); GameStop on X: "What's in your Power Pack?" — [X](https://x.com/gamestop/status/1950297041705586988)
- Fanatics combines livestream (breakers on Fanatics Live) with digital rips; first card free ("Debut Pack") — [Fanatics Live](https://www.fanatics.live/debut-pack)
- Promo codes (e.g. 15% off Courtyard) circulate on coupon and affiliate sites — [SimplyCodes](https://simplycodes.com/store/courtyard.io)

### Inferences
- Blind Box's free daily spin, reward-only coins and live pulls feed map directly onto Courtyard's daily-claim / points / leaderboard stack, which is evidently working for retention (see Q6 growth). Courtyard's 5,000 pts = $25 conversion (~0.5% rebate per dollar pulled, if points scale ~1/$) is a benchmark for coin generosity.
- Monthly cash/credit leaderboards rank by spend; for mass-market and regulatory optics Blind Box could rank by collection completeness or streaks rather than spend.
- Native app > mobile web for reveal smoothness (Power Packs reviews). Blind Box being mobile web should invest in animation performance and consider PWA install.

### Gaps
- No detailed descriptions of reveal animations, sound or haptics found for any platform (would require app hands-on or video review).
- No data found on streak mechanics specifically.

## 5. Payments, KYC, age limits, state restrictions

### Takeaway
Mainstream players accept cards/Apple Pay/Google Pay; crypto-native ones use USDC (Courtyard accepts both). Age gate is 18+ and KYC is triggered at withdrawal/redemption rather than at signup.

### Cited Findings
- Courtyard: 18+ (or age of majority); embargoed jurisdictions excluded; funding via credit/debit card, Apple Pay, Google Pay, or USDC on Polygon (via Coinbase); KYC required before withdrawing funds and when redeeming physical cards — [Courtyard Terms of Service](https://docs.courtyard.io/courtyard/logistics-and-legal/user-agreements/terms-of-service); [TheSpike (affiliate)](https://www.thespike.gg/reviews/courtyard-io); [Courtyard redemption docs](https://docs.courtyard.io/courtyard/logistics-and-legal/asset-redemption-and-shipping)
- Courtyard Trustpilot/Play reviews cite identity-verification problems and up to 5-day delays adding funds — [Trustpilot](https://www.trustpilot.com/review/courtyard.io)
- Collector Crypt / Solflare Packs: purchases in USDC (or CARDS token); Solflare offers a Coinbase-powered on-ramp for US users — [Solflare Packs](https://www.solflare.com/packs/); [Solflare help](https://help.solflare.com/en/articles/9081349-onramper-fiat-to-crypto-payment-provider-issues)
- Collector Crypt is reviewed by TheSpike under the heading "Is This Sweepstakes Casino Legit?" — indicating how affiliate gambling media classify it — [TheSpike](https://www.thespike.gg/reviews/collector-crypt)

### Inferences
- Gating KYC to cash-out is the norm; Blind Box has no cash-out, so it can keep signup friction minimal (but still needs age gate and address verification at ship).

### Gaps
- Could not confirm US state exclusions for any platform (none surfaced in snippets); Power Packs, Phygitals and Arena Club payment/KYC/age terms not retrieved.

## 6. Scale: users, sales, GMV, funding, public statements, traffic

### Takeaway
This is a fast-growing, large category: Courtyard went from $50K to ~$50M+/month in ~18 months and hit ~$78M in a single month; Collector Crypt has processed $600M+ in gacha and hit 40K daily users; onchain gacha across the top seven platforms reached ~$230M in May 2026 (7x YoY). GameStop's collectibles segment (which houses Power Packs, though Power Packs revenue is not broken out) is now ~45% of sales.

### Cited Findings
- **Courtyard**: $30M Series A (July 2025) led by Forerunner, with NEA, Y Combinator, Burst Capital, Prelude Ventures, ParaFi; ~$42M total raised; founded 2021 by Nicolas le Jeune and Paulin Andurand; monthly merchandise sales grew from $50K (Jan 2024) to $50M (July 2025) — [Courtyard blog](https://courtyard.io/blog/post/courtyard-io-raises-30-million-series-a-to-reimagine-collecting-71e8c1e9ef05); [Fortune (snippet)](https://fortune.com/2025/07/24/exclusive-forerunner-leads-30-million-round-in-collectibles-marketplace-courtyard/); [CB Insights](https://www.cbinsights.com/company/courtyard/financials)
- Courtyard August (2025) monthly sales ~$78.4M (record); every month since February above $40M; led August tokenized Pokémon volume ($78.4M of $124.5M across four marketplaces; Collector Crypt $44M) — [Bankless](https://www.bankless.com/read/courtyard-cards-onchain); [Yahoo Finance](https://finance.yahoo.com/news/tokenized-pok-mon-card-trades-104533525.html); [Decrypt](https://decrypt.co/370978/pokemon-cards-surging-crypto-platforms-gambling)
- Courtyard had most NFT volume on OpenSea for a day and +38.6K unique sales in a week (vs Axie Infinity +30.6K) — [Bankless](https://www.bankless.com/read/courtyard-cards-onchain). Daily Polygon trades rose from ~10K/day (late 2025) to 50K+ on many days in 2026 — search snippet attributed to Polygon/analytics coverage; [DappRadar](https://dappradar.com/dapp/courtyard)
- Courtyard revenue estimate $10M–$25M annual (estimate, data-vendor) — [LeadIQ/PitchBook-type profile snippet](https://leadiq.com/c/courtyard/6261ada21c78b336660df2b3) (ESTIMATE; low confidence — inconsistent with GMV of $50M+/month unless revenue is net of buybacks)
- **Collector Crypt**: 40K daily users and $4.07M weekly protocol revenue after Solflare Packs launch (June 2026); fees $3.86M in 7 days post-Solflare vs $1.68M prior week (+129%); 215K packs opened in a record week; total trading volume crossed $1B by May 2026; $53.34M cumulative protocol revenue (DeFiLlama); gacha alone >$85M pack sales (earlier figure); topped Pump.fun in daily revenue (June 2026) — [Solana Compass](https://solanacompass.com/news/collector-crypt-draws-40000-daily-users-as-solanas-consumer-app-layer-matures); [The Defiant](https://thedefiant.io/news/regulation/collector-crypt-fees-jump-129-in-a-week-as-solflare-brings-card-pack-trading-into-the-wallet); [Crypto Briefing](https://cryptobriefing.com/collector-crypt-record-tokenized-tcg-packs-solana/); [Genfinity](https://genfinity.io/2026/06/23/gacha-sports-collector-crypt-solana-flips-pump-fun/). Note: "$85M" (earlier) vs "$622.6M wagered" (Bitquery) vs "$635M gross" (4Pillars) reflect different dates/definitions.
- Market: top seven onchain gacha platforms did $230M in May 2026 (7x YoY), Solana 64% share — [Solana Compass](https://solanacompass.com/news/collector-crypt-draws-40000-daily-users-as-solanas-consumer-app-layer-matures); [Squared Tech](https://www.squaredtech.co/pokemon-card-nfts-hit-230m-the-new-crypto-gacha-gold-rush)
- **Phygitals**: $180M cumulative volume (April 2026) → $250M (May 2026); 520K+ units sold; 100K+ cards tokenized; bootstrapped with no outside funding initially (distributed ungraded Pokémon to Solana NFT communities); Fanatics Collect integration April 2026 — [FinanceFeeds](https://financefeeds.com/how-phygitals-is-bringing-real-world-collectibles/); [Genfinity](https://genfinity.io/2026/04/27/phygitals-fanatics-collect-solana-tokenized-trading-cards/)
- **Arena Club**: ~$25.5M total raised including $10M Series A and $6.5M Series A-II; investors include M13, defy.vc, Lightspeed, Elysian Park Ventures, BAM Ventures; ~40K collectors; up to 100 employees; ~$1M estimated annual revenue (estimate, data-vendor) — [Startupintros](https://startupintros.com/orgs/arena-club); [Sports Collectors Daily](https://www.sportscollectorsdaily.com/arena-club-series-a-funding/); [dot.LA](https://dot.la/arena-club-funding-2658897032.html)
- **GameStop**: Power Packs launched in fiscal Q2 2025 per 10-Q; public launch April 15, 2026. Q2 FY2026 (quarter ended Aug 1, 2026): collectibles net sales +57% to $356.3M, 45.1% of revenue (vs 23.4% a year earlier); total revenue $790.2M; net income $298.7M; operating income $160.2M; FY adj. EBITDA guidance raised to >$650M. Power Packs revenue not broken out in found sources — [GameStop 10-Q FY2026](https://www.sec.gov/Archives/edgar/data/0001326380/000132638026000055/gme-20260801.htm); [Yahoo Finance](https://finance.yahoo.com/markets/stocks/articles/gamestop-q2-2026-earnings-profit-174413093.html); [Benzinga](https://www.benzinga.com/markets/earnings/26/09/61658595/gamestop-delivers-top-line-beat-on-strong-collectibles-growth); [Insider Monkey](https://www.insidermonkey.com/news/gamestop-gmes-collectibles-business-is-quietly-rewriting-its-profit-story-1837768/)
- Trading card market sized at $15.8B (2024), projected $23.5B by 2030 (market-research estimate) — [Decrypt](https://decrypt.co/370978/pokemon-cards-surging-crypto-platforms-gambling)

### Inferences
- The "digital pack, physical item, vault" model has product-market fit at large scale, and big consumer brands (GameStop, Fanatics/Topps, Coinbase) are entering in 2025–2026 — validating Blind Box's concept for a non-card collectible.
- Gross volume is inflated by buyback recycling (same card sold ~8x/month); Blind Box GMV will look smaller but be "real" retail.

### Gaps
- No Similarweb traffic figures retrieved.
- No disclosed Power Packs unit/revenue numbers; no Fanatics Instant Rips/Instant Packs volume; Phygitals funding status after bootstrap phase unclear.

## 7. Controversies: gambling accusations, odds complaints, regulation, lawsuits, discontinuations

### Takeaway
The category is widely framed as gambling-adjacent (affiliate gambling sites list these as "sweepstakes/mystery boxes"; Decrypt: "Just Don't Call It Gambling"), and the 2026 legal climate tightened (NY AG suing Valve over loot boxes with cash-out; arbitration claims against Whatnot breaks; lawsuits against PackDraw). No lawsuit or regulatory action against Courtyard, GameStop Power Packs, Collector Crypt, Phygitals or Arena Club specifically was found. Power Packs was not discontinued — it graduated from beta to full public launch in April 2026.

### Cited Findings
- Operators defend the model with "positive expected value" (spend $50, get ~$55 of card value on average) and call it "gamified shopping" — [Decrypt](https://decrypt.co/370978/pokemon-cards-surging-crypto-platforms-gambling)
- Cointelegraph headline: "Gambling On Random Pokémon Cards: Onchain Gacha Hits Record Highs"; regulators generally treat pulls as loot boxes rather than gambling in most markets; several jurisdictions force odds disclosure; a June 2026 Reddit thread debated whether it is gambling in function — [Cointelegraph](https://cointelegraph.com/features/pokemon-cards-as-rwas-gacha-spending-hits-records-as-crypto-sinks)
- 2026: New York Attorney General sued Valve alleging loot boxes amount to illegal gambling — a theory targeting "paid randomized openings with a cash-equivalent exit"; March 2026: 15 arbitration complaints filed against Whatnot alleging randomized breaks are an unregulated online casino (Whatnot: "gambling isn't allowed on Whatnot"); PackDraw reportedly faces lawsuits in Minnesota and New York incl. allegations of recruiting a minor into offshore crypto gambling — [Covers / affiliate roundups (lower confidence; verify with primary legal sources)](https://www.covers.com/betting/card-rips); [Lines.com – PackDraw](https://www.lines.com/mistery-boxes/packdraw)
- FairGambling classifies "skins, gacha boxes, and card rips" together as "alt gambling" — [FairGambling](https://www.fairgambling.com/spotlight/alt-gambling-skins-gacha-mystery-boxes-card-rips)
- Bitquery: advertised EV 110.7% vs realised 94.2%; 78% of wallets lost money — [Bitquery](https://bitquery.io/investigations/collector-crypt-jupiter-gacha). 4Pillars: "Collector Crypt Has No Collectors" — nearly all pulls are liquidated, token value accrual only $1.4M (3.4% of net revenue) while the ops wallet off-ramped $45.7M USDC — [4Pillars](https://research.4pillars.io/en/research/collector-crypt-has-no-collectors)
- Courtyard complaints: perceived "better odds at the start" then worse; buyback ~84% net; FMV above external comps; high shipping fees, no tracking, slow support, KYC issues, can't delete account — [Trustpilot](https://www.trustpilot.com/review/courtyard.io); [Google Play](https://play.google.com/store/apps/details?id=io.courtyard.app&hl=en_US); recurring complaints also summarised as "shipping costs on redemptions, a feeling that odds have tightened since launch, and occasional slow support" — [PackSpy](https://packspy.com/sites/courtyard). Substack thread titled "Rigged" on card-rip odds — [Minted Moment](https://mintedmoment.substack.com/p/rigged/comments)
- Power Packs complaints: "odds horrible compared to other apps", buyback below market plus fees — [Google Play reviews](https://play.google.com/store/apps/details?id=com.gamestop.powerpacks.v1&hl=en_US)
- Industry consolidation concern: Rep. Pat Ryan asked the FTC to investigate Collectors' acquisitions of Beckett and SCG; legal experts raised monopoly questions — [Value Added Resource](https://www.valueaddedresource.net/congressman-pat-ryan-ftc-collectors-beckett/); [Sports Collectors Digest](https://sportscollectorsdigest.com/collectors-concerned-over-beckett-acquisition-legal-experts-raise-monopoly-question-after-purchase-by-psa)
- Beckett paused two lower-cost grading services amid demand surge — [Heavy](https://heavy.com/sports/cards/beckett-grading-news/)
- No discontinuation or lawsuit concerning Power Packs found — [GameStop IR](https://investor.gamestop.com/news-releases/news-details/2026/GameStop-Launches-Power-Packs-for-Digital-Trading-Cards/default.aspx); [Deadspin](https://deadspin.com/mystery-boxes/gamestop-power-packs/)

### Inferences
- The gambling critique centres on (a) cash-equivalent exits (buyback), (b) EV marketing that is negative after liquidation, (c) spend-ranked leaderboards. Blind Box avoids (a) by design; it should avoid (b) by not stating cash values/EV and (c) by not ranking on spend.
- "Odds tightened after I started" is a common suspicion; Blind Box's per-piece published rates plus a live shelf (showing remaining stock) could pre-empt it — e.g. a public, timestamped odds history.

### Gaps
- Primary court documents for NY AG v. Valve, Whatnot arbitrations and PackDraw suits not retrieved; details come from affiliate roundups.
- Reddit sentiment (r/PokemonTCG, r/baseballcards) not directly retrieved.

## 8. What design and growth tactics appear to be working

### Takeaway
Evidence points to: (1) low entry price points ($10–$25) plus a broad tier ladder; (2) instant gratification (reveal + instant decision); (3) aggressive gamified retention (points, daily claims, leaderboards, timed events); (4) distribution partnerships (Solflare/Rarible white-label, eBay, Yahoo Fantasy, Fanatics Collect listing); (5) public big-pull content; (6) brand trust anchors (PSA, GameStop, Fanatics/Topps, Derek Jeter).

### Cited Findings
- Distribution integrations moved the needle: Collector Crypt fees +129% week-over-week after Solflare Packs launched in-wallet — [The Defiant](https://thedefiant.io/news/regulation/collector-crypt-fees-jump-129-in-a-week-as-solflare-brings-card-pack-trading-into-the-wallet)
- New game format: Courtyard Gacha Machine reportedly drove $16M revenue in 7 days — [Bitget (aggregator)](https://www.bitget.com/news/detail/12560604953909)
- Courtyard growth from $50K to $50M monthly sales in ~18 months, coinciding with mystery-pack + buyback + points model — [Fortune (snippet)](https://fortune.com/2025/07/24/exclusive-forerunner-leads-30-million-round-in-collectibles-marketplace-courtyard/); points/events — [Courtyard blog](https://courtyard.io/blog/post/more-ways-to-earn-points-more-packs-to-rip)
- Courtyard added a $10 pack as an "approachable" on-ramp — [Courtyard blog](https://courtyard.io/blog/post/introducing-the-new-10-pokemon-basic-pack)
- Phygitals' bootstrap growth through nostalgia-led community seeding (giving away Pokémon cards to NFT communities) — [FinanceFeeds](https://financefeeds.com/how-phygitals-is-bringing-real-world-collectibles/)
- Arena Club uses scarcity drops (400/series, weekly Wednesdays) and media partnerships (Yahoo Fantasy weekly drops tied to performers) — [SI](https://www.si.com/collectibles/arena-club-launches-weekly-slab-pack-drops-with-ebay-as-exclusive-online-partner); [Yahoo Sports](https://sports.yahoo.com/fantasy/article/yahoo-fantasy-and-arena-club-launch-exclusive-weekly-slab-packs-featuring-top-fantasy-football-performers-120124320.html)
- Viral record pulls (e.g. ~$30K Power Pack Series 4 Gengar) and monthly "biggest pulls" round-ups provide earned media — [Resell Calendar](https://resellcalendar.com/news/news/gamestop-power-pack-series-4-gengar-record-sale/); [DK Network](https://dknetwork.draftkings.com/2025/04/18/courtyard-io-latest-pulls-april-2025-jayden-daniels-paige-bueckers-pokemon/)
- Free first pack/free-pull acquisition offers (Fanatics Live Debut Pack; Courtyard free-pack promos) — [Fanatics Live](https://www.fanatics.live/debut-pack); [TheLines](https://www.thelines.com/card-rips/courtyard-io/free-pack/)
- Affiliate marketing through sports-betting/gambling review publishers (Deadspin, Covers, TheLines, Strafe, TheSpike) is a major visible acquisition channel — e.g. [Deadspin mystery boxes hub](https://deadspin.com/mystery-boxes/); [Covers](https://www.covers.com/betting/card-rips)

### Inferences
- For Blind Box: a free daily spin + low-friction first box are proven acquisition levers; a recent-pulls feed mirrors the "biggest pulls" social proof; limited numbered series/drops (Arena Club, Power Packs "Series") create urgency.
- Caution: gambling-affiliate channels drive volume but associate the brand with gambling; mass-market positioning argues for toy/collector media and creator partnerships instead.
- Since Blind Box has no buyback, its retention must come from collection completion, shipping-bundle incentives (accumulate in Vault before shipping) and the reward-coin loop — exactly where Courtyard's points system offers a template.

### Gaps
- No A/B or retention-rate data from any platform.
- No Similarweb or app download estimates retrieved.
