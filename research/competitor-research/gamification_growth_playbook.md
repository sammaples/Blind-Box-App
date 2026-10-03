# Gamification, Retention and Growth-Loop Playbook for Opening/Collecting Apps

Scope note: researched October 2026 under a ~15-call budget. Sources run from primary (FTC, BEUC, HKEX/Pop Mart, Stripe, Sensor Tower, Duolingo blog) to secondary (vendor blogs, fan wikis, X posts). Reliability is flagged inline. Most famous growth case studies (Dropbox, Robinhood, early PWA cases) are from before 2022 and are marked **[OLD]**.

---

## 1. Pokémon TCG Pocket: scale, monetization cadence, pack UX, social features

### Takeaway
TCG Pocket is the strongest recent proof that digital pack opening can reach a mass market: about $1.25–1.3B in year one (AppMagic estimate) and more than 150M downloads in under a year. It works by giving free packs on a timer (with paid ways to skip the wait) and a light social layer (Wonder Pick). Its biggest misstep was a trading system that made players destroy duplicates. Revenue spikes with each new set, so content cadence drives monetization.

### Cited Findings
- First-year revenue was about $1.25B per AppMagic, roughly $245M more than Pokémon GO's first year. It passed $1B across Google Play and the App Store within about 200 days. **Estimate (third-party intelligence)**. See [PokeBeach](https://www.pokebeach.com/2025/10/pokemon-tcg-pocket-earned-record-1-25-billion-in-its-first-year-sparked-current-pokemon-tcg-shortages) and [Game Rant](https://gamerant.com/pokemon-tcg-pocket-vs-pogo-launch-year-revenue-record-comparison/). Another estimate puts it near $1.3B ([Udonis](https://www.blog.udonis.co/mobile-marketing/mobile-games/pokemon-tcg-pocket)).
- PokeBeach argues the game "sparked current Pokémon TCG shortages," meaning digital opening drove demand for physical product. This is a causal claim from a fan-news outlet and is not proven — [PokeBeach](https://www.pokebeach.com/2025/10/pokemon-tcg-pocket-earned-record-1-25-billion-in-its-first-year-sparked-current-pokemon-tcg-shortages)
- Downloads: 100M (Sensor Tower) — [Sensor Tower](https://sensortower.com/blog/pokemon-tcg-pocket-100-million-downloads), [PocketGamer.biz](https://www.pocketgamer.biz/pokmon-tcg-pocket-surpasses-100-million-downloads/). The Pokémon Company reported more than 150M downloads about a week before the first anniversary — [PocketGamer.biz](https://www.pocketgamer.biz/pokmon-tcg-pocket-surpasses-150m-downloads-in-under-a-year/)
- Q2 2025 decay (US Android): weekly downloads fell from about 306K at the start of Q2 to about 182K by the end of June. Active users fell from more than 4M to about 3.2M — [Sensor Tower Q2 2025](https://sensortower.com/blog/2025-q2-android-top-5-card%20battler-units-us-6041466a241bc16eb8e60969)
- Monthly revenue swings with set releases (Sensor Tower data as reposted on X, so unverified): June 2025 $53M, July $38M, September $27M, October $43M after the "Mega Rising" set — [X/@Spyyd3r Jul](https://x.com/Spyyd3r/status/1955962609460765130), [X/@Spyyd3r Oct](https://x.com/Spyyd3r/status/1984666747421802532). **Conflict:** the August post says "$38M in August, a huge jump from $53M in July," which contradicts the July post ($38M). Treat these monthly figures as low reliability — [X/@Spyyd3r Aug](https://x.com/Spyyd3r/status/1962545991510282385)
- Wait-timer economy: the Pack Hourglass (purple, Pikachu head) shortens the wait between free booster openings. The Wonder Hourglass (gold, heart) refills Wonder Stamina used for Wonder Picks — [PocketGamer](https://www.pocketgamer.com/pokemon-trading-card-game-pocket/hourglasses/), [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Hourglass)
- Wonder Pick lets a player pick one card at random from a pack another player has opened, and get a copy of it free. It turns other people's openings into your own chance to win — [Pokemon Zone](https://www.pokemon-zone.com/articles/wonder-pick/)
- Trading backlash: Trade Tokens arrived in late January 2025 and drew "an extremely negative response," partly because players had to **destroy duplicate cards** to earn them. High rarities and promo cards were also left out of trading — [GameSpot](https://www.gamespot.com/articles/pokemon-tcg-pocket-devs-promises-to-remove-trade-tokens/1100-6530149/), [Nintendo Life](https://www.nintendolife.com/news/2025/03/pokemon-tcg-pocket-update-to-remove-trade-tokens-following-player-feedback)
- Fix: DeNA/Creatures replaced Trade Tokens with **Shinedust**, which players earn automatically when they pull a card already in their Dex. They limited the cost to 3-diamond, 4-diamond and 1-star trades, and added a feature that shows friends which cards you want. Existing tokens could be converted 1:1 to Pack Hourglasses (capped at 60) — [Newsweek](https://www.newsweek.com/entertainment/video-games/pokemon-tcg-pocket-reveals-huge-changes-following-player-outrage-2044861), [Sportskeeda](https://www.sportskeeda.com/pokemon/pokemon-tcg-pocket-trade-token-changes-revealed), [ComicBook](https://comicbook.com/gaming/news/pokemon-tcg-pocket-free-hourglasses-for-trade-tokens/)

### Inferences
- For Blind Box, the relevant pattern is "free on a timer, pay to skip." A free daily spin or claim, plus tokens that shorten the wait, could feed coins without giving away product.
- Shinedust is effectively **duplicate protection by conversion**: a duplicate automatically becomes progress currency. The physical equivalent is crediting coins or "dust" for duplicate figures, or offering trade-in or swap credit. Making users give something up ("destroy to earn") caused the backlash, so dupe value should arrive automatically.
- A Wonder Pick analogue would fit the existing "recent pulls" feed: let a user claim a small free coin draw tied to someone else's live pull. This turns social proof into engagement. It should award coins or entries, not physical items, to limit cost and lottery-law exposure.
- Revenue in this genre is driven by drops. Plan for a regular release cadence of new series, because a static catalog decays the way Q2 2025 did.

### Gaps
- No primary source was found on how the pack opening *feels* (swipe-to-tear, card flip, rarity cues, haptics, sound) or on any measured effect. Commonly reported traits include a swipe to tear the pack, cards revealed one by one, and a special glow or slow-down for rare cards. These are not cited here and need checking against a GDC talk or teardown.
- The premium pass price and perks and the exact free-pack cadence (widely reported as 2 free packs a day on a 12-hour timer) were not verified from a primary source. Wikipedia was blocked.

---

## 2. Pity / bad-luck protection and duplicate protection

### Takeaway
Pity systems put a cap on the worst-case cost of chasing a rare. Genshin guarantees a 5-star by pull 90, with rising odds from about pull 74. This makes chasing more acceptable to players, and analysts say it raises spending near the threshold. Regulators now treat unclear odds and costs as deceptive (FTC vs HoYoverse, $20M, 2025). China's physical blind-box guidelines explicitly encourage a "minimum guarantee system," so physical pity is both feasible and favored by regulators.

### Cited Findings
- Genshin's hard pity is 90 pulls on both character and weapon banners. Because soft pity raises the odds from about pull 70–74, the average 5-star lands around pull 62–75, and most players never reach hard pity — [Alibaba product insights](https://www.alibaba.com/product-insights/gacha-game-pity-systems-explained-is-genshin-impact-or-honkai-star-rail-more-generous.html), [Shattered.io](https://shattered.io/how-gacha-drop-rates-calculated-2026/), [GashaPoint](https://gashapoint.com/gacha-games/pity-systems-explained/) (secondary and community-data sources)
- Behavioral claim: "Knowing the pity threshold exists paradoxically encourages players to keep pulling — the bounded worst case is more tolerable." Soft pity "demonstrably increases the conversion rate for players nearing the threshold." These come from analyst commentary, not primary data — [COGconnected](https://cogconnected.com/2025/10/the-genshin-impact-standard-how-pity-systems-and-soft-currency-caps-redefine-gacha-game-economics/), [MWM glossary](https://mwm.ai/glossary/pity-system)
- FTC vs HoYoverse (January 2025): $20M settlement. The FTC alleged the company deceived players about the odds of 5-star prizes and how much it cost to win them, and hid that consumers "commonly must spend large amounts of real money." Terms: no loot-box sales to under-16s without parental consent, mandatory disclosure of odds **and virtual-currency exchange rates**, and COPPA compliance — [FTC press release](https://www.ftc.gov/news-events/news/press-releases/2025/01/genshin-impact-game-developer-will-be-banned-selling-lootboxes-teens-under-16-without-parental), [FTC business guidance](https://ftc.gov/business-guidance/blog/2025/01/level-tips-businesses-ftcs-settlement-genshin-impact-developer-hoyoverse), [Game Developer](https://www.gamedeveloper.com/business/genshin-impact-developer-fined-20-million-over-loot-box-practices)
- China SAMR Interim Guidelines on Business Practices for Blind Boxes (June 2023), covering **physical** blind boxes:
  - Businesses must prominently disclose the probabilities, the value of the contents and the draw rules.
  - No sales to children under 8, and guardian consent is required for those aged 8 and up.
  - Businesses are encouraged to set up a **minimum guarantee system** and to cap draw counts and spending.
  - A single blind box generally costs no more than RMB 200.
  - Sources: [SCIO](http://english.scio.gov.cn/pressroom/2023-06/16/content_87751554.htm), [Bird & Bird](https://www.twobirds.com/en/insights/2023/china/china-technology,-media-and-telecom-bimonthly-update-july-august-issue), [Asiallians](https://asiallians.com/en/distribution-samr-issues-guidelines-for-business-conduct-for-blind-boxes-for-trial-implementation/), [Marketing-Interactive](https://www.marketing-interactive.com/china-market-regulator-ban-selling-mystery-box-to-under-eight)
- Shanghai's earlier local guidelines also capped prices and banned sales to under-8s. Pop Mart said it would "cooperate… to explore executable solutions" — [Yahoo Finance](https://finance.yahoo.com/news/shanghai-government-caps-price-blind-093000873.html), [Moomoo](https://www.moomoo.com/news/post/7599046/shanghai-released-guidelines-for-blind-box-operation-pop-mart-will)
- An academic paper (DiGRA) studies how well physical blind boxes comply with information-disclosure rules — [DiGRA](https://dl.digra.org/index.php/dl/article/download/2999/2983/3042)

### Inferences
- A physical pity system is straightforward: for example, "at least one Rare or better in every N boxes of a tier, tracked per account," shown as a visible progress meter ("3 of 10 to guaranteed Rare"). Because inventory is physical, the guarantee must be backed by stock reserves or by allocating from a pool when the order ships.
- Blind Box already shows per-piece pull rates, which puts it ahead of the FTC/SAMR expectation. The FTC also required disclosure of **currency exchange rates**. Blind Box's coin rates (earn 10 per $1, redeem at 100 per $1) should therefore be shown just as plainly. The effective rebate is 10%.
- Duplicate protection options for physical goods:
  - (a) dupe-to-coins credit on reveal, which mirrors Shinedust
  - (b) a "swap" option before shipping
  - (c) a peer trade marketplace
  - (d) "no dupe until set complete" within a series, which requires inventory control
- A soft-pity framing ("odds rise each box") is the version most likely to be criticized as manipulative. A transparent hard guarantee is the safer choice.

### Gaps
- No primary published data was found on how pity changes ARPPU or retention. The claims come from analyst commentary.
- UK, EU and Belgium loot-box rules (for example Belgium's ban and the UK industry principles) were not researched in this pass.
- No Western physical blind-box seller with a published pity guarantee was found.

---

## 3. Set completion / collection books, achievements, badges

### Takeaway
The most direct evidence connects collection to *duplicate value* (the Shinedust Dex). In physical blind boxes, Pop Mart's membership-led repeat buying (55.7% repurchase rate) shows collectors come back. However, no rigorous public study isolating the retention effect of collection books or badges was found.

### Cited Findings
- TCG Pocket's Card Dex sits at the centre of its economy. Pulling a card already in the Dex automatically earns Shinedust, which then funds trades — [Sportskeeda](https://www.sportskeeda.com/pokemon/pokemon-tcg-pocket-trade-token-changes-revealed), [PokemonGoHub currency guide](https://pokemongohub.net/post/tcg-pocket/currency-guide/)
- Pop Mart's mainland-China repurchase rate rose from 49.4% (2024) to 55.7% (2025), and members contributed 93.7% of sales — see section 6, [GMW](https://en.gmw.cn/2026-03/27/content_38675346.htm), [HKEX annual results](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0325/2026032500285.pdf)

### Inferences
- Blind Box's Vault should work as a collection book. Show every series with silhouettes for figures not yet owned, a completion percentage, and the chase or secret piece. Add a reward for completing a set, such as a bonus coin grant, an exclusive digital badge or first access to the next drop. "1 more to complete" is a strong prompt for both repeat purchase and trading.

### Gaps
- No quantified A/B data on the retention impact of badges, achievements or collection books was found. GDC or Deconstructor of Fun sources would be needed.

---

## 4. Streaks and daily rewards

### Takeaway
Streaks are one of the best-evidenced retention mechanics. Duolingo's streak freeze tests found that two freezes beat one, and three were no better than two. Duolingo also invests in protecting streaks from outages. A daily spin works better as part of a streak (escalating rewards, a forgiving freeze) than as a standalone lottery.

### Cited Findings
- Users with 7+ day streaks retain at 2.4x the rate of users who never build a streak, and more than 9M users have year-long streaks. These figures come from a **third-party teardown** that does not cite a Duolingo primary source, so treat them as unverified — [Apptitude](https://apptitude.io/blog/how-duolingos-streak-mechanic-actually-works/)
- Duolingo experiments found two equipped streak freezes worked better than one, and three were no better than two. Giving new users two freezes when they start a streak increased retention. This comes from Lenny's Podcast with Duolingo's retention PM Jackson Shuttleworth, via a summary — [Recall summary of Lenny's Podcast](https://www.getrecall.ai/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team)
- How a freeze works: one freeze covers one missed day. The count does not reset, but it does not go up either — [Duolingo wiki](https://duolingo.fandom.com/wiki/Shop/Streak_freeze)
- Duolingo protects streaks during its own site incidents, which shows how much it values streak trust — [Duolingo blog](https://blog.duolingo.com/protecting-streaks-from-site-issues/)

### Inferences
- Apply this to the current daily spin (50/250/1500 coins at 89/10/1%). The expected value is about 44.5 + 25 + 15 = **84.5 coins a day, about $0.85** of redemption value, which is meaningful.
  - Add a visible streak counter with escalating rewards (for example, a guaranteed bonus spin or a higher-tier wheel on day 7).
  - Give two free "streak shields."
  - Send a reminder notification. This requires the push work covered in section 9.
- Keep the wheel's odds visible on the wheel itself, consistent with the FTC/SAMR guidance in section 2.

### Gaps
- No primary Snapchat Streaks retention data was found.
- No published benchmark for daily-spin or check-in uplift in e-commerce was found.

---

## 5. Referral programs

### Takeaway
Two-sided rewards (Dropbox) and queue-jumping waitlists (Robinhood) are the classic templates, both **[OLD]**. Temu's referral "free gifts" scaled very fast but are widely described as conditional and hard to complete, and that has drawn regulatory scrutiny.

### Cited Findings
- **[OLD, 2008–2010]** Dropbox grew from about 100K to about 4M users in 15 months (3,900%). At its peak, 35% of daily signups came from referrals, with 2.8M referral invites in one month. Rewards were two-sided: both people got extra storage. These figures come from **secondary referral-vendor blogs** — [Referral Rock](https://referralrock.com/blog/dropbox-referral-program/), [Viral Loops](https://viral-loops.com/blog/dropbox-grew-3900-simple-referral-program/). The claim of 60% lower CAC is unverified — [Waitlister](https://waitlister.me/growth-hub/blog/dropbox-referral-program)
- **[OLD, about 2013–2014]** Robinhood's pre-launch waitlist reached about 1M signups. Each referral moved you up roughly 2,000 places, with no cash reward, and users could see their exact position — [LaunchList](https://getlaunchlist.com/blog/waitlist-referral-program-guide)
- Temu's gamified hub includes Free Gifts, Spin-the-Wheel, Crack-the-Egg, Farmland, Fishland, Lucky Flip and credits. Users usually have to invite new users to claim prizes — [Theseus thesis (Bury)](https://www.theseus.fi/bitstream/handle/10024/882642/Bury_Emely.pdf?sequence=2)
- Reported conditions for Farmland "free stuff": at least 50 successful referrals who order and play for two days, plus about $200 of personal spend. This is a **consumer-blog claim, not verified** — [Wethrift](https://www.wethrift.com/p/how-to-get-free-stuff-from-temu/). A fact-check calls the gifts "real as a marketing mechanism," but says the path is "deliberately difficult or conditioned on hard-to-meet terms," with confetti and near-complete progress bars — [Factually](https://factually.co/fact-checks/business/temu-invitation-free-gift-fact-check-347f28)

### Inferences
- For invite-only beta → mass launch, a Robinhood-style **visible queue with referral jumps** fits Blind Box's current gating and costs no product.
- After launch, a two-sided offer could work, for example "you and your friend each get X coins after the friend's first box ships." Paying out only after shipment limits fraud. Keep it achievable: Temu's near-complete progress bars and 50-referral thresholds are exactly what BEUC and the FTC criticize.
- Spell out the terms clearly. Never show a "free gift" whose conditions are hidden.

### Gaps
- No measured viral coefficient (K-factor) was found for Temu, Dropbox or any collectibles marketplace.
- No 2023–2026 primary case study of a referral program at a physical-goods marketplace was found.

---

## 6. Loyalty programs in collectibles (Pop Mart, tiered membership)

### Takeaway
Pop Mart is the benchmark for loyalty in collectibles: 72.58M registered mainland members, members driving 93.7% of sales, and repurchase rising to 55.7% in 2025. The lesson is that a membership program sitting on top of a collecting habit is the business itself, not an add-on.

### Cited Findings
- By the end of 2025: 72.58M cumulative registered members in mainland China, 26.5M added in the year, members contributing 93.7% of sales, and repurchase rising from 49.4% (2024) to 55.7% (2025) — [GMW (Guangming Online)](https://en.gmw.cn/2026-03/27/content_38675346.htm), [HKEX 2025 annual results](https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0325/2026032500285.pdf)
- Pop Mart's 2025 revenue topped RMB 37B, with overseas sales above 40% — [GMW](https://en.gmw.cn/2026-03/27/content_38675346.htm)
- First-half 2026 results and a buyback plan have been announced. Some commentary describes a "growth reset" and a reassessment of the stock — [Morningstar/PRN](https://www.morningstar.com/news/pr-newswire/20260820cn30497/pop-mart-reports-first-half-2026-financial-results-announces-future-stock-buyback-plan), [BigGo Finance](https://finance.biggo.com/news/dHTZLp0BrdTHlKtC9wuS), [36Kr](https://eu.36kr.com/en/p/3750711532569350)

### Inferences
- Blind Box's coins are a flat 10% rebate. Adding tiers based on spend or set completion over 12 months (for example Collector → Curator → Vault Keeper) could unlock:
  - a higher coin multiplier
  - early access to drops
  - free-shipping thresholds
  - member-only figures
- This follows the Sephora model, but the tier details were not researched here.

### Gaps
- Pop Mart's tier structure and perks, and the Sephora Beauty Insider tier economics, were not sourced in this pass.

---

## 7. Social proof & FOMO: live feeds, drops, draws, scarcity

### Takeaway
Drops and draws (Nike SNKRS) create demand, but the FTC explicitly names fake countdowns and false low-stock claims as dark patterns. Scarcity has to be real. A live pulls feed is legitimate social proof as long as it reflects real events.

### Cited Findings
- Nike SNKRS mixes first-come-first-served sales with Draws. Draw entry windows are typically 2–15 minutes — [Queue-it](https://queue-it.com/blog/sneaker-raffles/), [Drop-List](https://www.drop-list.com/guides/nike-snkrs-explained/)
- Nike's Exclusive Access uses more than 50 variables, including past SNKRS entries, content engagement and poll answers. Nike's CEO described personalized offers based on engagement. Some of this comes from secondary tip sites — [Drop-List](https://www.drop-list.com/guides/nike-snkrs-explained/)
- The FTC "Bringing Dark Patterns to Light" report (September 2022) defines a "Baseless Countdown Timer" (a fake clock that resets, e.g. "Offer ends in 00:59:48") and "False Low Stock" (e.g. "Only 1 left in stock" when that isn't true) as dark patterns, across 8 categories — [FTC report PDF](https://www.ftc.gov/system/files/ftc_gov/pdf/P214800+Dark+Patterns+Report+9.14.2022+-+FINAL.pdf), [Nat'l Law Review](https://natlawreview.com/article/ftc-releases-report-dark-patterns)

### Inferences
- Blind Box can safely run:
  - real limited editions with a visible edition size (for example "312 of 500 left")
  - scheduled drop countdowns that end at a real time
  - an entry window or draw for top-tier chase pieces, which also spreads load
  - a live pulls feed drawn only from real pulls, including common ones (showing only rares misrepresents the odds)
- A leaderboard for collection score or set completion is a low-cost option, but no evidence was gathered on it.

### Gaps
- No quantified conversion uplift from live purchase feeds or countdowns was found from a credible source.
- No Supreme-specific drop data was found.

---

## 8. Shareable moments (share cards, clips, UGC)

### Takeaway
No credible measured data was found in this pass. The case rests on inference from the genre's culture of filming openings (TCG Pocket, Pop Mart on TikTok).

### Cited Findings
- No citable findings were found for this question within the budget.

### Inferences
- After a reveal, offer a one-tap 9:16 share card or short clip. It should show the figure, its rarity and its pull rate (for example "1 in 72"), with a referral deep link built in. This connects shares straight to the referral loop in section 5.

### Gaps
- There is no data on how share-card features affect K-factor. TikTok "unboxing" engagement statistics and TikTok Shop collectible data were not researched.

---

## 9. PWA vs native app

### Takeaway
iOS web push works only after the user adds the PWA to the Home Screen and grants permission, so push reach is far smaller than native. One estimate puts it 10–15x smaller. The well-known PWA conversion wins are from 2016–2018 **[OLD]**. For a retention playbook that depends on streak reminders and drop alerts, a native wrapper or app becomes worthwhile once push matters.

### Cited Findings
- iOS supports web push for PWAs only once installed to the Home Screen and after the user grants permission. Accounting for the full funnel (discover → install → permission), PWA push reach is "roughly 10–15x smaller than native push." **This is a vendor estimate** — [MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide), [MobiLoud](https://www.mobiloud.com/blog/progressive-web-apps-ios/)
- In February 2024, Apple briefly removed EU Home Screen PWA support in the iOS 17.4 beta, then reversed it after pushback — [MobiLoud](https://www.mobiloud.com/blog/progressive-web-apps-ios/)
- **[OLD, about 2016–2018]** Reported PWA results:
  - AliExpress: +82% iOS conversions
  - Starbucks: about 2x daily active users (other sources say +20% conversion)
  - Alibaba: +76% conversions
  - United eXtra: +100% e-commerce sales via web push
  - Source: [MobiLoud](https://www.mobiloud.com/blog/progressive-web-apps-ios/), [TSH](https://tsh.io/blog/progressive-web-apps-in-2025)

### Inferences
- Stay a PWA during the beta, but plan a native shell (Capacitor or similar) once reminder-dependent loops (streaks, drops) launch.
- Note that App Store and Google Play rules on loot boxes require odds disclosure. In-app purchase of digital coins would fall under store payment rules, while physical goods generally do not. This needs checking against current store guidelines.

### Gaps
- No 2023–2026 primary data on PWA install-prompt rates or on iOS web-push opt-in rates was found.

---

## 10. Checkout conversion

### Takeaway
Digital wallets and guest checkout have the strongest evidence: +22.3% conversion for Apple Pay in Stripe's holdout test. Unexpected costs are the top reason people abandon checkout, so showing combined-shipping costs up front matters.

### Cited Findings
- Stripe ran a holdout experiment across more than 50 payment methods. Businesses that offered Apple Pay saw +22.3% conversion and +22.5% revenue on eligible checkouts. Showing Apple Pay earlier via the Express Checkout Element was associated with about 2x conversion compared with showing it at the end — [Stripe blog](https://stripe.com/blog/testing-the-conversion-impact-of-50-plus-global-payment-methods), [Stripe Apple Pay](https://stripe.com/payments/apple-pay)
- Baymard data (via aggregators):
  - 48% of shoppers abandon because of unexpected extra costs such as shipping, taxes and fees
  - 18% abandon because they would have to create an account
  - 19% abandon because they don't trust the site with their card
  - the average US checkout shows 23 form elements
  - **These are secondary citations of Baymard** — [Baymard](https://baymard.com/blog/current-state-of-checkout-ux), [Growthegy](https://www.growthegy.com/2026/05/26/cart-abandonment-science-why-customers-leave-checkout/), [Shno](https://www.shno.co/marketing-statistics/checkout-conversion-statistics)
- Shop Pay has been reported at +91% conversion on mobile. This is Shopify's own figure via an aggregator, so treat it with caution — [Shno](https://www.shno.co/marketing-statistics/checkout-conversion-statistics)

### Inferences
- Blind Box's email/phone code sign-in is effectively account creation. Letting Apple Pay or Google Pay act as both identity and payment for the first box would remove the 18% "create account" barrier.
- Show shipping costs on the box page, and show the progress bar toward combined shipping or free shipping before checkout.

### Gaps
- No credible 2023–2026 data on first-purchase discounts or the uplift from free-shipping thresholds was found.

---

## 11. Ethical, dark-pattern and regulatory caveats

### Takeaway
Regulators in the US, EU and China are converging on the same points: disclose odds and real costs, protect minors, avoid fake urgency and hard-to-exit flows, and treat gamified referral and "free gift" mechanics with suspicion. Temu is the cautionary example.

### Cited Findings
- **FTC vs HoYoverse (2025):** $20M; no loot-box sales to under-16s without parental consent; disclose odds and currency exchange rates — [FTC](https://www.ftc.gov/news-events/news/press-releases/2025/01/genshin-impact-game-developer-will-be-banned-selling-lootboxes-teens-under-16-without-parental)
- **FTC dark patterns report (2022):** names baseless countdown timers and false low stock — [FTC PDF](https://www.ftc.gov/system/files/ftc_gov/pdf/P214800+Dark+Patterns+Report+9.14.2022+-+FINAL.pdf)
- **EU DSA and Temu:** BEUC and 17 member groups filed complaints (May 2024) alleging that Temu:
  - uses dark patterns that push consumers to spend more than they intended
  - makes closing an account hard
  - is not transparent about how it recommends products
  - does not adequately trace its traders
  - BEUC credits Temu's growth to discounts, a **gamified experience** and intensive advertising.
  - The European Commission opened formal DSA proceedings against Temu.
  - Sources: [BEUC report PDF](https://www.beuc.eu/sites/default/files/publications/BEUC-X-2024-046_Temu_Why_the_fast-growing_online_marketplace_fails_to_comply_with_the_DSA.pdf?gsid=03271d76-9538-4365-a754-9bdd6bdf77a4), [BEUC](https://www.beuc.eu/reports/taming-temu-why-fast-growing-online-marketplace-fails-comply-eu-digital-services-act), [Euronews 2024](https://www.euronews.com/2024/05/16/eu-consumer-groups-call-for-dsa-probe-into-temu), [Euronews 2025](https://www.euronews.com/my-europe/2025/07/31/the-eus-growing-list-of-online-platforms-under-investigation)
- A consumer group has also accused Shein of manipulative "dark patterns" — [CBC](https://www.cbc.ca/lite/story/1.7552989)
- **China SAMR (2023):** no blind-box sales to under-8s; guardian consent for those aged 8 and up; disclose odds and value; encourages guarantees and spending caps — [SCIO](http://english.scio.gov.cn/pressroom/2023-06/16/content_87751554.htm)

### Inferences
- Minimum compliance posture for Blind Box:
  - Keep the per-piece odds already shown, and also disclose the coin-to-dollar rate.
  - Add age gating plus parental consent for minors. Blind boxes are paid chance purchases, and the FTC/HoYoverse precedent sets the threshold at under 16.
  - Use only real scarcity and real timers.
  - Make account deletion easy.
  - Offer optional spending limits or "cool-down" tools. China encourages caps, and they work as good-faith signals.
  - Keep referral terms achievable and clearly stated.
- The free daily spin awards coins only and involves no purchase. That is probably low-risk, but "no purchase necessary" sweepstakes rules and the legal status of chance-based paid physical goods by state or country need legal review. That review was not researched here.

### Gaps
- Not researched in this pass:
  - US state gambling or sweepstakes law as it applies to paid mystery boxes
  - UK CMA, Belgium and Netherlands loot-box positions
  - the EU Digital Fairness Act proposal on dark patterns and virtual currencies (expected 2026)
  - COPPA specifics for the sign-in flow
