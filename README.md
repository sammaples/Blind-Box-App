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

## Your catalogue

**The shop sells the pieces you upload.** Nothing is generated: the catalogue is
data you own, managed at `/admin`.

### Uploading it

The Catalogue tab takes a CSV with a header row. Only two columns are required:

| column | required | notes |
| --- | --- | --- |
| `name` | yes | |
| `scale` | yes | `100%` or `400%` — `100` and `400` also work |
| `set` | no | whatever you call the set, e.g. "Series 47" |
| `series` | no | a number, used to group the shelf |
| `rarity` | no | common, uncommon, rare, ultra, secret, grail |
| `image` | no | a photo URL, `http(s)` or site-relative |
| `notes` | no | shown on the piece's detail sheet |
| `quantity` | no | **stocks the piece in the same upload** |

Header names are matched loosely, so `Name`, `Set Name`, `Size`, `Tier`,
`Photo`, `QTY` and `Description` all land where you would expect. A template is
downloadable from the console.

Every upload is **previewed before it commits**: how many rows were read, which
columns were understood, a sample, and a line-numbered complaint about anything
rejected. A bad row is skipped rather than failing the whole file.

Re-uploading updates pieces rather than duplicating them — pieces are keyed by
`id`, which is derived from the name unless you supply your own. So a corrected
export is safe to send again, and an `id` column of your own SKUs makes that
exact.

### Stocking it

Uploading with a `quantity` puts pieces straight on the shelf. After that,
the shelf table has an exact-quantity box for "I counted them, there are
nineteen", quick +1/+5/+25 buttons for topping up, and Pull for taking the rest
off the shelf.

**Archiving** a piece withdraws it: it leaves the shop and can no longer be
drawn, while its stock record and its past orders survive, so restoring it
brings it back as it was. Verified by draining a whole shelf and confirming an
archived piece was never once pulled.

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

### Starting from nothing

A fresh shop has an empty catalogue and sells nothing, which is correct — there
is no invented stock to sell. Upload a CSV, or press **Load the demo catalogue**
to fill it with 780 generated pieces so you can see the whole thing working
before your own photography exists.

## Admin accounts

Admin is a property of an account, reached through the same emailed sign-in as
everyone else — there is no second password to share or leak. List the addresses
in `ADMIN_EMAILS`:

```bash
ADMIN_EMAILS=you@yourdomain.com,partner@yourdomain.com
```

An account is promoted the next time it signs in, so a newly listed address
needs one fresh sign-in. Removing an address revokes admin the same way.

With `ADMIN_EMAILS` unset the console is open in development, so it can be tried
with no setup, and refuses to load in production.

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
    pieces.ts      # the shop's own catalogue, from the database
    csv.ts         # catalogue import: parsing, aliasing, per-row validation
    inventory.ts   # default quantities the console offers when stocking
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
- **Change log authorship.** Admin is now a real account, but the change log
  still records only *what* changed and when. Adding the account id to each
  entry is a small change worth making before more than one person is editing.
- **Photo hosting.** Pieces reference an image URL; there is no upload-a-file
  path, so photos need to live somewhere already. A URL that fails to load
  falls back to the generated art rather than showing a broken image.

## Artwork

The figures are original vector art, generated per piece from its palette and
pattern — no photography and no licensed images. `BearbrickArt.tsx` draws the
silhouette once and fills it with a gradient, print or pattern, which is how the
whole catalogue ships with zero image assets.
