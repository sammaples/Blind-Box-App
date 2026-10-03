# Blind Box — project briefing

Read this before working on the app. It is the shared memory for every chat
on this repo: what the product is, what has been decided, and how to work.
Keep it current — when a decision changes, change it here in the same commit.

## What it is

A mobile-first shop for physical blind-box collectibles (Bearbrick-style
figures). Live at **https://ripnshipapp.vercel.app**, in an invite-only beta.
Next.js 16 app router + Tailwind + framer-motion, Postgres (Neon) via
node-pg-migrate, with a JSON-file backend for local use. Installable to the
iPhone Home Screen as a PWA.

- **Boxes:** four tiers — Bronze ($25), Silver, Gold, Diamond ($250) — in
  100%, 400% and a 400%/100% combo size. All four are buyable (Diamond's
  "coming soon" flag was removed; the flag still exists for future boxes).
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
- **Profile:** silver button top right. Rows: My vault, Rewards, Coins, and
  for admins Inventory management and Invites. Delete account is supported.
- **Sign-in:** Apple (shows "Apple sign in isn't available right now" until
  configured), **Continue with email** and **Continue with phone**, each
  opening a sheet: address/number, then a typed code. Codes exist because a
  Home Screen app keeps its own cookies, separate from Safari.
- **Invite-only:** only addresses/numbers on the in-app invite list (profile →
  Invites) can sign in; admins (`ADMIN_EMAILS`) always can. Browsing needs no
  invite. The list lives in the database, never in code — this repo is public.
- **Shop pages hide "Non-Series"** under a piece's name; only series pieces
  show a series line. The console still shows it.
- **No stock counts** are shown to shoppers anywhere.

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

- **Email sign-in:** `RESEND_API_KEY` and `EMAIL_FROM` in Vercel, with
  `EMAIL_FROM` on a domain verified in Resend (Resend's test domain only
  reaches the account owner, so friends would get no code).
- **Phone sign-in:** Twilio Verify — `TWILIO_ACCOUNT_SID`,
  `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` (Sam will set up later).
  Limit SMS countries in Twilio.
- **Apple sign-in:** not configured yet.
- **Legal:** before a wide launch, a lawyer should review the draw for
  lottery/gambling risk (California, New York, Washington), and the payment
  processor should approve the business in writing. Keep no-sell-back.

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
and invite rules as production does, `ADMIN_EMAILS` set to a test address.
Without `ADMIN_EMAILS`, local admin mode lets every signed-in account in.
