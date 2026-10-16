# Blind Box — project briefing

Read this before working on the app. It is the shared memory for every chat
on this repo: what the product is, what has been decided, and how to work.
Keep it current — when a decision changes, change it here in the same commit.

## What it is

A mobile-first shop for physical blind-box collectibles (Bearbrick-style
figures). Live at **https://ripnshipapp.vercel.app**, in an open beta.
Next.js 16 app router + Tailwind + framer-motion, Postgres (Neon) via
node-pg-migrate, with a JSON-file backend for local use. Installable to the
iPhone Home Screen as a PWA.

- **Collections:** the front page (`/`) is "Pick a collection" — thick bars
  stacked down one screen: **Be@rbrick** (always written that way, capital B),
  **Pop Mart, Squishy, TapCap**. Each bar shows the collection's cover photo
  (uploaded in Inventory management → collection → Change cover; stored as the
  `cover:<collection>` setting) or, until then, a scene with three figures —
  all four are cut-out photos of real pieces
  (`public/collections/<collection>-left|middle|right.webp`, 960px tall,
  upscaled with Real-ESRGAN before cutting out; all three at full
  brightness, never dimmed or blurred; embedded in the simulator too).
  TapCap's came off a dark forest scene, so they were cut out with BiRefNet
  and colour-corrected for its blue moonlight. Squishy's (bao in its steamer,
  lid kept; NeeDoh cube; cat burger) are wide and low, so they stand side by
  side instead of overlapping (`fit.row`), level and raised towards the
  middle, the bao far left; the name sits a little higher on that bar
  (`nameLift`) so the lid clears it.
  The faint print behind them is silhouettes of the same photos
  (`<collection>-shape-middle|left.png`), so the pattern is the figures in
  front — real Be@rbrick shapes on the Be@rbrick bar.
  On the other bars the middle one stands in front. Each opens
  `/shop/<collection>`, the box shop below, over that
  collection's own pieces and stock. Defined in `src/lib/lines.ts` (code calls
  a collection a "line"); adding one is an entry there plus its drawing in
  `CollectionArt` and its box print in `BoxPrint`. Every piece belongs to one
  collection; draws filter on collection + tier. Bearbrick's box ids stay
  `bronze`…`diamond`; others are `<collection>-<tier>`.
- **Boxes:** four tiers per collection — Bronze ($25), Silver, Gold, Diamond
  ($250). Bearbrick pieces come in 100%, 400%, a 400%/100% combo and 1000%
  (migration 1700000024000); the
  other collections have no sizes (hidden everywhere). All tiers are buyable
  (Diamond's "coming soon" flag was removed; the flag still exists).
- **Box prints:** each collection's carton has its own print — bears on blue,
  vinyl figures on pink (Pop Mart), squishies on mint (Squishy), block figures
  on slime green (TapCap — its bar and colour are slime green too). The
  printed figures are the bar photos' outlines, traced to vectors in
  `src/lib/figureShapes.ts` (regenerate when the photos change).
- **Current stock** (`/stock`) starts on the same collection bars; each
  collection's stock is `/stock/<collection>`, with just a back arrow to the
  bars (no collection switcher), then the box tabs and rarity filters.
- **The draw:** one real piece per box, drawn server-side at purchase from a
  live stock shelf. Pull rates are published per piece and move as stock
  sells. Each order stores its seed and a snapshot of the shelf.
- **Open:** animated reveal. The shop shows a turning 3D box and a
  "recent pulls" carousel; a new pull lands with a glow that lasts 6.5s.
- **Vault:** pieces wait there and ship together for one flat postage. The
  ship bar is pinned above the tab bar with Select all.
- **Coins — reward only.** 10 coins per $1 spent; redeeming a box costs 100
  coins per $1 of its price (Bronze $25 = 2,500 coins). A box bought with coins
  earns no coins. **No buying coins, no selling pieces back, no cash-out.**
- **Daily spin** (Rewards tab): free once a day, 14 slots (1×1,500, 2×250,
  11×50) at odds 1/10/89%, drawn on the server; odds behind an ⓘ. Real
  ratchet click per peg. Admins get a "Reset my daily spin" button.
- **Trade-in** (Rewards tab, under the daily spin; `/rewards/trade`): a bar
  picks the box — **3 pieces for Bronze, 5 Silver, 10 Gold, 25 Diamond**
  (`TRADE_IN_COST` in `src/lib/tradeIn.ts`). Pick that many opened vault
  pieces from **one** collection, tap Combine, they spin down a whirlpool
  (floating in one ring, or two rings for 10/25, pouring in ring by ring), and
  a sealed box of that tier and collection comes out. Server side and atomic:
  the orders become `traded` and the box is drawn from the shelf like a
  bought one (refused if that box is sold out). The new order keeps
  `made_from`; it earns no coins. Traded pieces don't go back on the shelf
  automatically.
- **Profile:** silver button top right. Rows: My vault, Rewards, Coins, and
  for admins Inventory management and Sign-in. Delete account is supported.
- **Tester gate: OFF.** Sam turned the access code off; sign-in is back to
  email / phone / Apple. The code is still there to switch on: set
  `ACCESS_CODE` in Vercel (e.g. `blindbox`) and every page and API call sits
  behind `/access` (`src/proxy.ts`, `bb_access` pass cookie); the right code
  signs the browser in as its own **tester account** (`tst_…` id, no email
  or phone, `bb_tester` cookie), never an admin, and the sign-in screen
  offers "Continue as tester". Unset or `off` = no gate. Tester accounts
  made while it was on still work. The simulator has the gate off too.
- **Sign-in:** Apple (shows "Apple sign in isn't available right now" until
  configured), **Continue with email** and **Continue with phone**, each
  opening a sheet: address/number, then a typed code. Codes exist because a
  Home Screen app keeps its own cookies, separate from Safari.
  Email codes are **6 digits** (were 8 characters), subject "123456 is your
  Blind Box code", so iPhone offers the code from a new Mail/Messages
  message above the keyboard (the field is `autocomplete="one-time-code"`,
  numeric) and a full code signs in by itself. A **Paste code** button reads
  the clipboard for Gmail and other apps. Five wrong codes retire that
  sign-in (`login_tokens.failed_attempts`, migration 1700000023000); a new
  code has to be sent.
- **Open testing (on):** anyone signs in by typing just their email — no
  code — so friends can test while emailed codes only reach
  Sam (Resend is on its test domain). **Admin addresses (`ADMIN_EMAILS`) never
  take the shortcut**; they still need the emailed code, and only they get
  Inventory management. Switch on Profile → Sign-in (`/admin/sign-in`, stored
  as the `open_testing` setting; on unless switched off). Anyone can sign in
  as any non-admin address while it's on — fine for the beta, not for launch.
  Mirrored in the simulator.
- **No invite list:** everyone can sign in (Sam removed invite-only). With
  open testing off, sign-in is by emailed code / phone / Apple. The old
  `invites` table is left in the database, unused.
- **Shop pages hide "Non-Series"** under a piece's name; only series pieces
  show a series line. The console still shows it.
- **No stock counts** are shown to shoppers anywhere.
- **Real listings added in code:** Be@rbrick **Series 49, 50, 51 and 52
  Blind Box** — sealed 100% boxes, Common, in the Bronze box (migrations
  1700000017000, 1700000019000, 1700000020000; photos in `public/products/`,
  on transparent backgrounds — Series 51's added by 1700000018000 to every box
  it is in; Series 49's had a crease across the top retouched out).
  **Chase Spider-Man No Way Home Blind Box** (100%) is a Rare in Bronze
  (1700000027000).
  **Rule (Sam): every Be@rbrick 400%, 400%/100% and 1000% is a Chase** —
  picking one of those sizes in Add product sets Chase.
  **Marc Jacobs** 400%/100% set, **Marc Jacobs** 1000%, **Care Bears
  Cheer Bear** 400%, **Barbie** 400% and **BAPE x F1 Las Vegas** 400%/100%
  are Diamond-box chases (1700000022000, 1700000025000, 1700000026000,
  1700000028000, 1700000029000; photos upscaled with Real-ESRGAN and cut out with BiRefNet,
  so white on the figure stays).
  1700000021000 brings Series 51 level with 50: back in Bronze if it was
  removed, and in every box Series 50 is in. Current stock only lists pieces
  with units, so a listing with none doesn't show there.
  Listed with no units: they sell once stocked in Inventory management.
- **Inventory management** (`/admin`) opens on the collection bars (pieces
  and units under each name). Tap one: **Bronze / Silver / Gold / Diamond**
  buttons; the stats, series shortcuts and Add product (starts in that box)
  follow the box. Three tabs: **All products** (every product in the
  collection once, however many boxes it's in — coloured dots for its boxes,
  units summed), **In this box** (opens first) and **Change log**. Stocking is
  on each piece's sheet; the old "On the shelf" and "Stock a piece" tabs are
  gone. The list puts hand-made listings before the generated
  demo pieces (it shows 120 at most). A piece's sheet has a **Boxes**
  drop-down: tick boxes, and each ticked box has its own − / + amount to add
  (shows what's in its pool now); "Add N units & save" (the `setBoxes`
  action with `add: {bronze: 5, …}`). No 6/12/24 presets; its pull rate counts the whole box. The
  cover photo is at the bottom of the collection's page. The three-card welcome
  never shows on `/admin` pages. The spreadsheet import takes a
  `collection` column (Bearbrick if blank; "set" is the set name), and scale is
  only required for Bearbrick rows. Template: `public/catalogue-template.csv`.
- **One product, several boxes:** Add product / Edit details has tick boxes
  for Bronze/Silver/Gold/Diamond plus "All boxes". Each ticked box gets its
  own listing — own units, own pull rate — tied by id (the first keeps the
  plain id, the rest are `<id>-in-<box>`; `src/lib/listings.ts`). Editing any
  one changes all of them; unticking a box deletes that listing if it never
  sold, otherwise archives it. "Units per box" stocks each new box the same.
  No simulator mirror: the simulator has no Inventory management.

## Sam's preferences (the owner)

- People don't like to read. Keep copy short; no explanatory paragraphs.
- **Don't change the sign-in screen's gradient** — Sam loves it.
- Plain language in replies; say what changed and what Sam needs to do.
- Every app change should also be made in the **simulator** and republished
  (see below), unless Sam says otherwise.

## The simulator

A single-file HTML mirror of the app, published as an artifact at
**https://claude.ai/artifact/Bh6uDVTdLCkpKW97eMS678**. Its source is
`simulator/blind-box-simulator.html` (plus `simulator/sounds/hover-loop.wav`,
already uploaded with the artifact). To update it: edit that file, publish it
to that URL with the Artifact tool, then commit the file. State lives in the
viewer's localStorage, so render code must tolerate old saved data.

## Branches and deploying

- `claude/blind-box-collectibles-app-cwj3e8` is the repo's default branch and
  what Vercel deploys to the live site. Pushing to it ships.
- The "Animations" chat works on `claude/stoic-heisenberg-xzeq0u` and merges
  into the default branch through pull requests.
- Don't open a pull request unless Sam asks. Don't rewrite history
  (`git reset --hard` / force-push are off-limits).
- Migrations run automatically on deploy (`vercel-build` runs
  `node-pg-migrate up`).
- Next.js here is v16: read `node_modules/next/dist/docs/` before writing
  Next code (see AGENTS.md).

## Secrets and private data

Never paste or commit: the Neon connection string, `AUTH_SECRET`, Resend
keys, Twilio credentials, the Apple `.p8` key, or anyone's email address or
phone number. Sam enters secrets straight into Vercel. The repo is public.

## Still to do (outside the code)

- **Before a wider launch:** turn Open testing off (Profile → Sign-in).
- **Email sign-in:** `RESEND_API_KEY` and `EMAIL_FROM` in Vercel, with
  `EMAIL_FROM` on a domain verified in Resend (Resend's test domain only
  reaches the account owner, so friends would get no code).
- **Phone sign-in:** Twilio Verify — `TWILIO_ACCOUNT_SID`,
  `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` (Sam will set up later).
  Limit SMS countries in Twilio.
- **Apple sign-in:** not configured yet.
- **Legal:** before a wide launch, a lawyer should review the draw for
  lottery/gambling risk (California, New York, Washington) — the trade-in
  too — and the payment processor should approve the business in writing.
  Keep no-sell-back.

## Research

- `research/competitor-research/` — notes on mystery-box sites, card
  rip-and-ship platforms, live rips, designer-toy brands, growth tactics, user
  reviews, and the rules (gambling, app stores, payments, international).
- The "research" chat is doing a hands-on look at the competitor sites and
  will add `research/REPORT.md` and `research/hands-on/`. Sam chooses what to
  build from it; recommendations are not to be implemented unasked.

## Testing locally

Playwright is at `/opt/node22/lib/node_modules/playwright/index.mjs` with
Chromium preinstalled (don't run `playwright install`). For a local Postgres,
initdb a cluster, run migrations with `DATABASE_URL=… npx node-pg-migrate up`,
and start `next dev` with `DATABASE_URL`, `AUTH_SECRET` and, to test admin
and the open-testing rules as production does, `ADMIN_EMAILS` set to a test address.
Without `ADMIN_EMAILS`, local admin mode lets every signed-in account in.
