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
Verified by firing 750 parallel purchases at a 665-unit shelf: exactly 665 were
accepted, 85 were correctly refused as sold out, and no piece oversold.

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
    store.ts       # JSON-file persistence (swap this file for a database)
    payments.ts    # payment provider seam; ships with a mock
    session.ts     # cookie-backed collector identity
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
    api/                  # orders, reveal, ship, verify, admin
```

## What is stubbed

- **Payments.** `src/lib/payments.ts` is a provider interface with a mock
  implementation. Nothing is charged and no card details are collected or
  stored. Implement the interface against Stripe and swap the export at the
  bottom of that file; no caller changes.
- **Persistence.** Orders and sold counts live in `data/db.json`, which is
  gitignored. Fine for a demo, not for production traffic — reimplement
  `src/lib/store.ts` against a real database. The transaction boundary in
  `stock.ts` is already the right shape for `SELECT … FOR UPDATE`.
- **Fulfilment.** Shipping a box sets a status and a tracking number locally.
  There is no carrier integration behind it.
- **Accounts.** A collector is an httpOnly cookie, so pulls follow the browser
  rather than a login.
- **Admin accounts.** The console is one shared password, not per-user logins.
  The change log therefore records *what* changed and when, but never *who* —
  there is no identity to record. Fine for one or two people; add real accounts
  before a team relies on it, at which point the log gains an author column.

## Artwork

The figures are original vector art, generated per piece from its palette and
pattern — no photography and no licensed images. `BearbrickArt.tsx` draws the
silhouette once and fills it with a gradient, print or pattern, which is how the
whole catalogue ships with zero image assets.
