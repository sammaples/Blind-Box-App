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
| `rarity` | no | chase, rare, common — the old six-tier names still import and are mapped |
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

### Adding a product

**Catalogue → + Add product** is the whole listing flow: pick which blind box
the piece belongs to, give it a title, and choose a photo. The photo uploads
immediately and appears in the form, so a wrong file is obvious before anything
is saved. Fill in **Units in hand** and the piece goes onto the shelf in the
same click; leave it blank and it sits in the catalogue, listed but not yet
pullable.

Photos are stored as bytes the shop owns and served from `/api/images/:id`. The
file type is read from the file's own leading bytes rather than from what the
browser claims, and SVG is refused outright — it is XML that can carry script,
and these are served from the same origin as the session cookie.

### What happens to an uploaded photo

A phone camera produces a 4000-pixel, six-megabyte JPEG; the shop draws it at
about 200 pixels. Every upload is resized once on the way in, and the original
is not kept:

| | in | out |
|---|---|---|
| phone photo | 4032×3024, 6.2 MB | 1400×1050 WebP, 188 KB |
| already web-sized | 280×280, 24 KB | untouched |

Quality is the constraint, not the file size. Nothing is ever enlarged, the
resample is Lanczos 3, and the re-encode is WebP at quality 90 — measured
against a lossless downscale of the same photo, quality 90 scores 35.1 dB PSNR
at 132 KB while quality 95 costs 285 KB for 36.1 dB. That extra decibel is not
visible; the doubled page weight is. If a file needed no resizing and our
encode came out no smaller, the upload is kept as it arrived.

Three details that are easy to get wrong and were: the EXIF orientation flag is
applied before it is discarded, or every portrait photo taken on a phone arrives
on its side; animated GIFs keep all their frames rather than collapsing to a
still; and a decoded-pixel ceiling refuses the small PNG that expands to 40,000
pixels square, which is otherwise a way to take the server's memory with one
upload.

A second, 320-pixel rendition is stored alongside for list views — the catalogue
draws up to 120 photos at 48 pixels each — and is skipped when the photo was
already small enough for it to be a duplicate. Metadata is not carried across,
so the GPS coordinates a phone writes into a photo do not end up published with
a picture taken at home.

### Editing and removing a product

Open a piece and the sheet carries **Edit details**, **Archive** and **Delete**.

Editing reopens the same form with the fields filled in, and carries the id
along — which is what makes a save an update rather than a second listing, so
fixing a typo in a title does not leave you with two of the same bear. The
photo can be replaced there too.

Archive and Delete are different promises. Archiving takes a piece out of the
shop and out of the draw while keeping it on the orders that already pulled
it. Delete removes it outright — and only works while nothing has sold. Ask to
delete something that has shipped and it is archived instead, and told you so:
an order names the piece it pulled, so deleting one would leave a collector
looking at a blank card. The sold count is read and the row removed in one
transaction, because a purchase landing between the two would take the piece
out from under an order that already exists.

### Stocking what you have

Stock is managed by hand, because being in stock on every series at once is not
how this works. The catalogue is a wall of product shots — two to a row on a
phone, four on a desktop — each carrying the two facts that matter: how rare the
piece is, and whether it is currently in the pool. Tap one and a sheet opens
with a quantity stepper and the arithmetic already done: *adding 12 puts this
piece at 28.6% of the 100% shelf*. The count moves the moment the change lands,
and so do the published rates, since a rate is only ever a piece's share of the
units left. **Take out of the pool** removes a piece's remaining units from the
draw without touching what has already sold, and **Set exact count** is there
for "I recounted the shelf and there are nineteen".

The console is reachable from inside the app: admin accounts get an
**Inventory** link in the header. Everyone else does not see it, and would be
refused at the door anyway — it is the console's own access check being asked,
not a second guess at it.

### Starting from nothing

A fresh shop has an empty catalogue and sells nothing, which is correct — there
is no invented stock to sell. Add products one at a time, upload a CSV, or press
**Load the demo catalogue** to fill it with 780 generated pieces so you can see
the whole thing working before your own photography exists.

## Admin accounts

Admin is a property of an account, reached through the same emailed sign-in as
everyone else — there is no second password to share or leak. List the addresses
in `ADMIN_EMAILS`:

```bash
ADMIN_EMAILS=you@yourdomain.com,partner@yourdomain.com
```

An account is promoted the next time it signs in, so a newly listed address
needs one fresh sign-in. Removing an address revokes admin the same way.

`/admin` shows a sign-in form to anyone who is not signed in, and every
`/api/admin/*` route answers 401 — the console is not a page that renders and
then hides its buttons. A signed-in account that is not on the list is told
exactly that, rather than being sent back to sign in again.

With `ADMIN_EMAILS` unset the console refuses to load in production, and in
development treats any signed-in account as the owner so the app can be tried
without configuring anything. Signing in is still required either way.

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
