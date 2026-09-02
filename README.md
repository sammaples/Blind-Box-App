# Blind Box

A collectible blind box app. You buy a sealed box, open it on screen with a
proper opening animation, and the physical figure you pulled gets shipped to
you. Every pull rate is published before you buy.

## The two boxes

| Product | What you get |
| --- | --- |
| **100% Blind Box** | One sealed 100% figure, drawn from the 100% pieces currently in stock |
| **400% Blind Box** | One sealed 400% figure, drawn from the 400% pieces currently in stock |

Neither box has a fixed contents list. A box contains whatever is on its shelf
at that moment, so the line-up changes on its own as inventory arrives and sells.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

`npm run build && npm start` for a production build. There is nothing to
configure — no keys, no database, no image assets.

### Running on Postgres

```bash
export DATABASE_URL=postgres://user:password@localhost:5432/blindbox
npm run migrate     # applies migrations/ — a deploy step, before the app starts
npm start
```

The warehouse then seeds itself from `src/lib/inventory.ts`. With
`DATABASE_URL` unset the app falls back to a JSON file at `data/db.json`, needs
no migration step, and runs with no database at all — which is what keeps the
demo zero-config.

### Changing the schema

Migrations live in `migrations/` and are run by
[node-pg-migrate](https://github.com/salsita/node-pg-migrate), which reads
`DATABASE_URL`.

```bash
npm run migrate:create -- add-order-status-index   # writes a timestamped .sql file
npm run migrate                                    # apply everything pending
npm run migrate:down                               # roll back the last one
```

Each file has an `-- Up Migration` and a `-- Down Migration` section; write
both, because the down is what makes a bad deploy recoverable. Applied
migrations are recorded in a `pgmigrations` table, so `npm run migrate` is safe
to run repeatedly and on every deploy.

**The app never creates or alters tables itself.** A server that reshapes the
database on boot can do it halfway through a rolling deploy, with two versions
of the code running at once. Instead it checks its tables exist and, if they do
not, fails with the command to run. A database migrated while the app is
already running recovers on the next request, without a restart.

## Adding inventory

**Stock lives in the database and is managed at `/admin`.** No deploy, no code
edit — the console is the restocking tool.

- **Stock a whole series** in one click, which sets every piece in it to the
  default unit count for its rarity. Applied as one batch, so a series never
  lands half-stocked.
- **Restock a piece** with +1 / +5 / +25 straight from the shelf table.
- **Pull a piece** to take its remaining units off the shelf. Sales history
  stays intact, so past orders still reconcile.
- **Add a piece** that has never been stocked, from the full reference
  catalogue.
- **Read the change log** of every stock edit, newest first, grouped by the
  click that made it — so stocking a series is one line, not fifteen. Each
  entry records the units before and after, which is what lets you explain why
  a shelf looks the way it does. Sales are deliberately absent: the orders
  behind them are already the record of those units. The log keeps the most
  recent 1,000 edits.

`src/lib/inventory.ts` seeds the opening shelf the first time the app runs and
is never consulted again. Editing it will not change a warehouse that has
already been seeded — use the console.

### Getting into the console

Set `ADMIN_PASSWORD` and the console asks for it. Leave it unset and the console
is open in development, so you can try it with no setup, and refuses to load in
production. An unprotected inventory editor on a public URL is not something
anyone should get by accident.

### Pull rates are not set by hand

A piece's rate is **its share of the units left on the shelf**. Stock six of
something and it is exactly six times as likely as a piece you stocked one of.
This means the published rates and the draw cannot disagree — they are the same
arithmetic over the same numbers — and a restock moves both at the same instant.

Stock counts only ever grow: the database records how many units have been put
into circulation and how many have sold, and what is left is the difference. So
a restock is a bigger number, never a migration. Setting a total below what has
already sold is floored at the sold count, because units that left the building
cannot be un-shipped.

## Accounts

**Buying requires an account.** A box is a physical object that has to reach a
person, so an order can never be tied to nothing but a cookie the buyer might
clear before it ships.

Signing in is an emailed link — no passwords to store, reset or leak:

1. You enter an email. A single-use token is issued, stored only as a hash, and
   valid for fifteen minutes. Requesting a new link retires the previous one.
2. Opening the link redeems the token and starts a session. Redeeming checks
   and consumes in one step, so a link cannot be used twice even if it is
   opened twice at once.
3. The session is an httpOnly cookie signed with `AUTH_SECRET`.

One account per address, compared case-insensitively and enforced by a unique
index — not just by the code that reads it.

A browser that collected anything before accounts existed has those orders
moved onto the account the first time it signs in, so making an account never
orphans a collection.

### What sign-in needs configured

- `AUTH_SECRET` — required in production. Without it the app refuses to sign
  anyone in rather than falling back to the development key, which is published
  in this repository. Generate one with `openssl rand -hex 32`.
- **An email provider.** Set `RESEND_API_KEY` and `EMAIL_FROM` together and
  sign-in links are sent for real, through
  [Resend](https://resend.com). Set neither and `src/lib/email.ts` falls back to
  a mock that logs the link to the server console; outside production it also
  returns the link in the API response, so the flow is playable with no setup at
  all. In production without a real sender, sign-in refuses — telling someone to
  check their email when nothing was sent is worse than an error.

  `EMAIL_FROM` has to be an address on a **domain you have verified with
  Resend**, which means adding their DNS records. An unverified domain is the
  usual first failure: Resend returns 403, the visitor gets "we could not send
  that email just now", and the reason is named in the server log.

  To use a different sender, write another `EmailProvider` and pick it in
  `chooseProvider` — nothing else changes.

## How a pull works

1. **Purchase.** `POST /api/orders` charges through the payment provider seam,
   then draws a piece, takes its unit off the shelf, and writes the order — all
   in one transaction.
2. **Reveal.** `POST /api/orders/:id/reveal` flips the order's status and
   returns the piece that was already decided. Calling it twice is safe and
   always returns the same piece.
3. **Ship.** `POST /api/orders/:id/ship` attaches an address and queues the
   order for packing.

The draw happens at purchase, server-side, and the piece is withheld from every
client-facing response until the order is revealed — so refreshing, replaying
the reveal call, or anything else done in the browser cannot change the outcome.

Because the draw, the stock decrement and the order write share one
transaction, two simultaneous buyers can never take the same last unit.
Verified on both backends by firing 750 parallel purchases at a 665-unit shelf:
exactly 665 were accepted, 85 were correctly refused as sold out, no piece
oversold, and each piece stocked as a single unit sold exactly once.

On Postgres the guarantee comes from the database rather than the process. The
draw depends on the whole shelf, so `reserve` takes `SELECT … FOR UPDATE` over
that shelf's rows: buyers of one shelf serialise, buyers of different shelves do
not block each other. A `check (sold <= stocked)` constraint backs it up, and
refuses an oversell even from raw SQL that bypasses the app entirely.

### Every roll can be replayed

Stock moves, so an order carries a snapshot of the shelf it was drawn from
alongside its random seed. `GET /api/orders/:id/verify` replays the seed
against that snapshot and reports whether it reproduces the delivered piece.
Without the snapshot a past draw could never be checked again, since today's
shelf is a different shelf.

## Layout

```
src/
  lib/
    inventory.ts   # the opening shelf, used once to seed the warehouse
    admin.ts       # who may read and change stock
    stock.ts       # live availability, odds, and atomic reservation
    catalog.ts     # the reference catalogue of every piece that exists,
                   # generated deterministically from the series and type
                   # tables; not the same thing as what is buyable
    draw.ts        # the weighted draw, and the replay used to verify one
    rng.ts         # seeded uniform + weighted pick
    db/            # the storage seam: one interface, two implementations
      types.ts     #   what the app needs persisted
      json.ts      #   JSON file — zero setup, single process
      postgres.ts  #   Postgres — schema, row locks, constraints
    store.ts       # collector and order persistence, via the seam
    payments.ts    # payment provider seam; ships with a mock
    auth.ts        # emailed sign-in links and the session cookie
    email.ts       # email provider seam; ships with a mock
  components/
    BearbrickArt.tsx  # the figures, drawn as vector art from palette + pattern
    BoxOpening.tsx    # the opening: shake, burst, rise, reveal
    SetBrowser.tsx    # the shelf, with each piece's rate and units left
    AdminConsole.tsx  # restocking, pulling, and adding pieces
  app/
    page.tsx              # onboarding, shop, shelf
    admin/                # the inventory console
    open/[orderId]/       # the opening experience
    collection/           # past pulls and their shipping status
    auth/callback/        # opens a sign-in link
    api/                  # orders, reveal, ship, verify, auth, admin
```

## What is stubbed

- **Payments.** `src/lib/payments.ts` is a provider interface with a mock
  implementation. Nothing is charged and no card details are collected or
  stored. Implement the interface against Stripe and swap the export at the
  bottom of that file; no caller changes.
- **Persistence.** With `DATABASE_URL` unset everything lives in
  `data/db.json`, which is gitignored, serialised through one in-process lock,
  and would corrupt if two Node processes shared it. That is a demo store, not
  a production one — set `DATABASE_URL` and the same app runs on Postgres.
- **Migration safety net.** The boot check catches an unmigrated database,
  which is the mistake people actually make. It does not catch a database that
  is migrated but out of date — keeping a deploy's `npm run migrate` ahead of
  its app start is what handles that.
- **Fulfilment.** Shipping a box sets a status and a tracking number locally.
  There is no carrier integration behind it.
- **Sign-in hardening.** There is no rate limit on link requests, so a single
  address can be mailed repeatedly. Sessions cannot be revoked centrally
  either — signing out clears the cookie, but a stolen one stays valid until it
  expires. Both want doing before this takes money.
- **Admin accounts.** The console is one shared password, not per-user logins.
  The change log therefore records *what* changed and when, but never *who* —
  there is no identity to record. Fine for one or two people; add real accounts
  before a team relies on it, at which point the log gains an author column.

## Artwork

The figures are original vector art, generated per piece from its palette and
pattern — no photography and no licensed images. `BearbrickArt.tsx` draws the
silhouette once and fills it with a gradient, print or pattern, which is how the
whole catalogue ships with zero image assets.
