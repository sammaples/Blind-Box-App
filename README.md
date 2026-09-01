# Blind Box

A collectible blind box app. You buy a sealed box, open it on screen with a
proper opening animation, and the physical figure you pulled gets shipped to
you. Every pull rate is published before you buy.

## The three drops

| Product | What you get | Pool |
| --- | --- | --- |
| **100% Series Roulette** | One 100% figure from any series, 1–52 | 780 pieces |
| **Guaranteed Secret** | A secret chase piece, every time | 52 secrets (7 grails at reduced odds) |
| **400% Big Box** | One 400% figure, guaranteed | 28 curated colourways |

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

`npm run build && npm start` for a production build. There is nothing to
configure — no keys, no database, no image assets.

## How a pull works

1. **Purchase.** `POST /api/orders` charges through the payment provider seam,
   then draws the piece immediately and stores it on the order.
2. **Reveal.** `POST /api/orders/:id/reveal` flips the order's status and
   returns the piece that was already decided. Calling it twice is safe and
   always returns the same piece.
3. **Ship.** `POST /api/orders/:id/ship` attaches an address and queues the
   order for packing.

The draw happens at purchase, server-side, and the piece is withheld from every
client-facing response until the order is revealed — so refreshing, replaying
the reveal call, or anything else done in the browser cannot change the outcome.

### Odds are published, and checkable

`oddsFor(productId)` is the single source of truth for both the rates shown in
the UI and the weights the draw actually runs against, so the two cannot drift
apart. Every order also stores the random seed it was drawn from;
`GET /api/orders/:id/verify` replays that seed and reports whether it
reproduces the delivered piece.

Verified against 900,000 simulated draws: all 860 pieces appear, and observed
frequencies match published odds within normal sampling error.

## Layout

```
src/
  lib/
    catalog.ts     # 780 pieces generated deterministically from the series
                   # and type tables — pure, so the client rebuilds it locally
                   # rather than downloading it
    draw.ts        # the draw, and the replay used to verify one
    rng.ts         # seeded uniform + weighted pick
    store.ts       # JSON-file persistence (swap this file for a real database)
    payments.ts    # payment provider seam; ships with a mock
    session.ts     # cookie-backed collector identity
  components/
    BearbrickArt.tsx  # the figures, drawn as vector art from palette + pattern
    BoxOpening.tsx    # the opening: shake, burst, rise, reveal
    SetBrowser.tsx    # every piece in the pool with its pull rate
  app/
    page.tsx              # onboarding, shop, set browser
    open/[orderId]/       # the opening experience
    collection/           # past pulls and their shipping status
    api/                  # orders, reveal, ship, verify
```

### Tuning the pull rates

Rates live in two tables in `src/lib/catalog.ts`. `TYPE_SPECS` sets the lineup
inside every numbered series and the weight of each piece — the weights sum to
1000 per series, which is what keeps all 52 series equally likely in a mixed
pool. `BIG_SPECS` does the same for the 400% collection. `poolWeight()` lets a
single product re-weight its own pool on top of that; the guaranteed-secret box
uses it to pull the grails back. Change a weight and both the published rates
and the draw follow, together.

## What is stubbed

- **Payments.** `src/lib/payments.ts` is a provider interface with a mock
  implementation. Nothing is charged and no card details are collected or
  stored. Implement the interface against Stripe and swap the export at the
  bottom of that file; no caller changes.
- **Persistence.** Orders live in `data/db.json`, which is gitignored. Fine for
  a demo, not for concurrent production traffic — reimplement `src/lib/store.ts`
  against a real database.
- **Fulfilment.** Shipping a box sets a status and a tracking number locally.
  There is no carrier integration behind it.
- **Accounts.** A collector is an httpOnly cookie, so pulls follow the browser
  rather than a login.

## Artwork

The figures are original vector art, generated per piece from its palette and
pattern — no photography and no licensed images. `BearbrickArt.tsx` draws the
silhouette once and fills it with a gradient, print or pattern, which is how 780
distinct-looking colourways ship with zero image assets.
