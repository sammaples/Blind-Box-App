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

**`src/lib/inventory.ts` is the only file you edit when new stock lands.**

```ts
export const STOCKED_SERIES = [3, 12, 24, 38, 52];   // 100% shelf
export const STOCK_ALL_400 = true;                    // 400% shelf
export const EXTRA_UNITS = { "s7-secret-0": 1 };      // one-offs
```

Add a series number to put that whole series on the shelf; remove one to pull
it. `EXTRA_UNITS` handles single pieces arriving outside a drop, overrides the
default unit count for one that did, and setting a piece to `0` keeps it out
entirely. `UNITS_BY_RARITY` at the top of the file sets how many units a piece
arrives with, by scale and rarity.

Everything downstream follows on its own: which pieces a box can contain, what
each one's pull rate is, which series the shop offers as filters, and when a
piece disappears because the last unit sold.

### Pull rates are not set by hand

A piece's rate is **its share of the units left on the shelf**. Stock six of
something and it is exactly six times as likely as a piece you stocked one of.
This means the published rates and the draw cannot disagree — they are the same
arithmetic over the same numbers — and a restock moves both together.

The numbers only ever grow in the inventory file: it declares how many units
have been put into circulation, and the database counts how many sold. What is
left is the difference. So a restock is a bigger number, never a migration.

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
    inventory.ts   # WHAT IS IN STOCK — the file you edit
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
  app/
    page.tsx              # onboarding, shop, shelf
    open/[orderId]/       # the opening experience
    collection/           # past pulls and their shipping status
    api/                  # orders, reveal, ship, verify
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
- **Restocking.** Editing `inventory.ts` means a deploy. If stock changes often
  enough to be annoying, move that file's contents into the database and give
  it an admin screen — nothing else has to change, since everything already
  reads availability through `stock.ts`.

## Artwork

The figures are original vector art, generated per piece from its palette and
pattern — no photography and no licensed images. `BearbrickArt.tsx` draws the
silhouette once and fills it with a gradient, print or pattern, which is how the
whole catalogue ships with zero image assets.
