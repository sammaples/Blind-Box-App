"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import {
  formatOdds,
  PRODUCTS,
  RARITY_COLOR,
  RARITY_LABEL,
  RARITY_ORDER,
} from "@/lib/catalog";
import type { Product, Pull, Rarity, StockEntry } from "@/lib/types";
import { isPrinted } from "./BoxPrint";
import { ProductBox } from "./ProductBox";
import { useAccount } from "./AccountBar";
import { Price } from "./ui";
import { useScrollLock } from "@/lib/useScrollLock";
import { useLivePulls } from "@/lib/useLivePulls";
import { coinPrice, topUpFor } from "@/lib/coins";
import { BoxCarousel } from "./BoxCarousel";
import { HowItWorksButton } from "./HowItWorks";
import { RecentPulls } from "./RecentPulls";
import { BuyCoins } from "./BuyCoins";
import { Coins } from "./Coin";

/** The boxes on sale, plus the checkout sheet that seals one. */
export function Shop({
  shelves,
  pulls,
}: {
  shelves: Record<string, StockEntry[]>;
  pulls: Record<string, Pull[]>;
}) {
  // Everybody's pulls, kept current while the shop is open.
  const livePulls = useLivePulls(pulls);
  const [checkout, setCheckout] = useState<Product | null>(null);
  // Which box the rail has centred. The panel below reads it; the rail owns
  // it, because the rail is the thing that can be swiped.
  const [active, setActive] = useState(0);
  const showing = PRODUCTS[Math.min(active, PRODUCTS.length - 1)];
  // The box is as big as the rail has room for. This page is laid out to fit
  // the screen exactly, and the rail is the part that gives: a tall phone gets
  // a bigger box, a short one a smaller box, and neither one scrolls.
  const [trackHeight, setTrackHeight] = useState<number | null>(null);
  const boxWidth = boxWidthFor(trackHeight);
  const { account, signIn } = useAccount();

  /**
   * Buying needs an account, so an unsigned-in buyer is asked for one first
   * rather than being let through and refused at the end.
   */
  const startCheckout = (product: Product) => {
    if (product.comingSoon) return;
    if (!account) {
      signIn("A box is a real object that has to reach you, so we need an account before you buy. No password — we email you a link.");
      return;
    }
    setCheckout(product);
  };

  return (
    <section
      id="shop"
      className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 scroll-mt-20 flex-col px-5 sm:px-8"
    >
      {/* The page's heading now that there is no headline above it. */}
      {/* Silver, with a light running across it: the first thing on the
          page, and plain white type there read as a form heading. */}
      {/* The "?" sits at the far end of the heading's row: where the eye
          goes after reading it, and clear of the boxes below. */}
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1
          className="shimmer-text w-fit shrink-0 text-3xl font-semibold tracking-tight sm:text-4xl [@media(max-height:720px)]:text-2xl"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #9d9dad 0%, #f5f5f7 28%, #ffffff 46%, #ffffff 54%, #f5f5f7 72%, #9d9dad 100%)",
          }}
        >
          Pick your box
        </h1>
        <HowItWorksButton />
      </div>

      {/*
        The boxes swipe; nothing else does.

        They were cards, and a card meant every box carried its own copy of
        the name, the rates and the button — so swiping moved four Buy buttons
        past you and you pressed whichever happened to stop under your thumb.
        Only the carton travels now. What it pulls and how to buy it sit
        underneath, in one panel that stays where it is and changes to match.
      */}
      <BoxCarousel
        onActive={setActive}
        loop
        fill
        onTrackHeight={setTrackHeight}
        backdrop={<BoxAura showing={showing.id} />}
      >
        {PRODUCTS.map((product) => (
          <FloatingBox key={product.id} product={product} width={boxWidth} />
        ))}
      </BoxCarousel>

      {/*
        Between the dots and the name, which is where it answers the question
        the dots just raised. Swiping the rail above says there is another box;
        this says what has been coming out of the one you have stopped on —
        and links to the full breakdown, so this screen can stay about buying.
      */}
      <RecentPulls
        pulls={livePulls[showing.id] ?? []}
        shelf={shelves[showing.id] ?? []}
        productId={showing.id}
        productName={showing.name}
      />

      <BoxDetail
        product={showing}
        shelf={shelves[showing.id] ?? []}
        onBuy={() => startCheckout(showing)}
      />

      <CheckoutSheet product={checkout} onClose={() => setCheckout(null)} />
    </section>
  );
}

/**
 * The light the boxes sit in.
 *
 * One glow for the whole rail rather than one per box, and it belongs to
 * whichever box is in front of you: it stays put while the cartons slide
 * through it, which is what a light in a room does. Two layers, because one
 * gradient blurred once comes out evenly dim — spread over that much area
 * nothing is bright enough anywhere to read as a source — and the broad halo
 * needs a brighter core to fall away from.
 *
 * Switched, not faded. Every tier's glow is drawn and only the one in front
 * is shown, and the change is instant: a half-second crossfade read as the
 * screen lagging behind the swipe, with the old box's colour still behind
 * the new box. And because the
 * gradients are drawn well past the rail's edges and nothing here clips, the
 * colour carries up into the heading and down past the dots instead of
 * stopping at a hard line.
 */
function BoxAura({ showing }: { showing: string }) {
  return (
    <>
      {PRODUCTS.map((product) => (
        <div
          key={product.id}
          className="absolute inset-0"
          style={{ opacity: product.id === showing ? 1 : 0 }}
        >
          <div
            className="absolute left-1/2 top-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[64px]"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${product.accent} 0%, color-mix(in srgb, ${product.accent} 62%, transparent) 34%, color-mix(in srgb, ${product.accent} 22%, transparent) 58%, transparent 78%)`,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-75 blur-xl"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${product.accent} 0%, color-mix(in srgb, ${product.accent} 50%, transparent) 45%, transparent 72%)`,
            }}
          />
        </div>
      ))}
    </>
  );
}

/**
 * One box, floating.
 *
 * No card, no border, no background — the carton and nothing else. A card
 * around it was doing two jobs, and the second one was the problem: it
 * grouped the box with a name and a button, which is exactly the grouping
 * that had to come apart for the button to stop moving.
 *
 * The light it sits in is deliberately NOT here. A horizontally scrolling
 * element clips its other axis too — CSS will not let `overflow-x: auto`
 * keep `overflow-y: visible`, it computes to auto — so any glow rendered
 * inside the rail is sliced off flat at the rail's top and bottom edges. It
 * read as letterboxing, which is a strange thing for a shop to look like.
 * `BoxAura` draws it behind the rail instead, where nothing crops it.
 *
 * Full width and snap-centred, so one box is the thing in front of you and
 * the next two sit half off each edge.
 */
/**
 * How wide a box fits in a rail this tall.
 *
 * Measured, not guessed: across a full turn and the float, a box paints
 * 1.93 times as tall as it is wide. Less the card's padding and a little air,
 * and kept to multiples of seven, which is what makes an 11:7 box land its
 * height on a whole pixel. Capped so a tall desktop window does not get a box
 * the size of a door, and floored so a very short one still shows a box.
 */
function boxWidthFor(trackHeight: number | null): number {
  if (!trackHeight) return 119;
  const fits = (trackHeight - 16 - 12) / 1.95;
  return Math.max(56, Math.min(168, Math.floor(fits / 7) * 7));
}

const FloatingBox = memo(function FloatingBox({ product, width }: { product: Product; width: number }) {
  return (
    <div
      data-box-card
      className="group relative flex h-full w-full shrink-0 snap-center items-center justify-center py-2"
    >
      {/* Floating for real, not just uncarded. The same drift the revealed
          piece uses, so the two read as one house style. */}
      <div className="relative float-soft">
        <ProductBox accent={product.accent} printed={isPrinted(product.id)} width={width} glint />
      </div>
    </div>
  );
});

/**
 * What the box in front of you pulls, and how to buy it.
 *
 * Outside the rail on purpose. The one rule this layout has is that the Buy
 * button does not move, and the reason it is a rule is that a button which
 * moves under a swiping thumb gets pressed by accident — on the one control
 * in the app that takes money.
 *
 * Which makes the heights here load-bearing rather than cosmetic. A bronze
 * shelf lists three rates and a diamond one lists two, so left to itself this
 * panel is a different height per box and the button walks up and down as you
 * swipe. Everything above the button is therefore given room for the worst
 * case and told to stay that size.
 */
function BoxDetail({
  product,
  shelf,
  onBuy,
}: {
  product: Product;
  shelf: StockEntry[];
  onBuy: () => void;
}) {
  const inStock = shelf.filter((e) => e.available > 0);
  const unitsLeft = inStock.reduce((sum, e) => sum + e.available, 0);
  const soldOut = unitsLeft === 0;
  // Not on sale yet outranks sold out: a box nobody can buy has not sold out,
  // and saying so would be the wrong story about the same disabled button.
  const comingSoon = product.comingSoon === true;

  return (
    <div className="mx-auto mt-7 w-full max-w-md shrink-0 pb-4 [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:pb-3">
      {/*
        Named, and nothing else.

        The tagline is gone. It described a box that is already in front of
        you, three lines of it, and the rates underneath say the same thing in
        numbers — so it was the longest part of the panel and the least of it.

        Keyed on the product and faded in, but deliberately not wrapped in an
        AnimatePresence: `mode="wait"` keeps the outgoing name mounted while it
        animates away, so for a couple of hundred milliseconds the panel shows
        one box's name above another box's rates. Remounting on the key swaps
        both together and has nothing to go stale.

        The height is still fixed, and still load-bearing. One line of name is
        one line for every box today, but the rule is that nothing above the
        Buy button may change height, and a longer name later must not be the
        thing that breaks it.
      */}
      <div className="min-h-[2rem] text-center">
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* In the box's own metal — copper, silver, gold, ice — with a
              light passing over it, so the name reads as the finish of the
              thing you are about to buy rather than a label under it. */}
          <h3
            className="shimmer-text mx-auto w-fit max-w-full truncate text-xl font-bold tracking-tight"
            style={{
              backgroundImage: `linear-gradient(100deg, color-mix(in srgb, ${product.accent} 55%, #000) 0%, ${product.accent} 26%, color-mix(in srgb, ${product.accent} 30%, #fff) 45%, #fff 50%, color-mix(in srgb, ${product.accent} 30%, #fff) 55%, ${product.accent} 74%, color-mix(in srgb, ${product.accent} 55%, #000) 100%)`,
            }}
          >
            {product.name}
          </h3>
        </motion.div>
      </div>

      {/* Room for every rarity a shelf can list, whether or not this one lists
          them: four rows at 20px with 8px between them. Measured, not guessed,
          and it is what pins the button. There is no stock line under it —
          how many pieces and units are left is not something the shop shares. */}
      <div className="mt-5 min-h-[6.75rem] [@media(max-height:720px)]:mt-3">
        <OddsByRarity shelf={shelf} />
      </div>

      {/*
        The one control that does not move.

        The price is not on it: the checkout sheet states it before anything is
        committed to, which is the moment it has to be right. The gloss only
        when it can be pressed — a shimmer is an invitation and "Sold out" is
        not inviting anything — and the dead state takes light text on grey
        (7.3:1) rather than the accent's dark ink dimmed into it, which came
        out at 1.4:1.
      */}
      <button
        type="button"
        onClick={onBuy}
        disabled={soldOut || comingSoon}
        className={`w-full rounded-2xl py-4 text-base [@media(max-height:720px)]:py-3 font-semibold transition-transform duration-300 disabled:cursor-not-allowed disabled:hover:scale-100 ${
          soldOut || comingSoon
            ? "text-chalk/80"
            : "gloss text-ink hover:scale-[1.02] active:scale-[0.99]"
        }`}
        style={{ background: soldOut || comingSoon ? "#3a3a44" : product.accent }}
      >
        {comingSoon ? "Coming soon" : soldOut ? "Sold out" : "Buy a box"}
      </button>
    </div>
  );
}

/**
 * What this box pulls, by tier.
 *
 * A horizontal bar per rarity, because the question is magnitude across a
 * handful of named things — how likely is each — and length answers that at a
 * glance where four percentages in a row do not.
 *
 * The numbers are not a marketing estimate. A tier's chance is its share of
 * the units left on this shelf, which is the same arithmetic the draw runs,
 * summed per tier. Restock a chase and the bar moves on the next page load.
 *
 * Each bar is named on its own row, so the colour is not carrying identity —
 * it is there to match the badge the same tier wears everywhere else. That
 * matters: the four rarity colours are close enough that a colourblind reader
 * could not separate them, and this chart never asks anyone to.
 */
function OddsByRarity({ shelf }: { shelf: StockEntry[] }) {
  const rows = useMemo(() => {
    const units = new Map<Rarity, number>();
    let total = 0;
    for (const entry of shelf) {
      if (entry.available <= 0) continue;
      units.set(entry.piece.rarity, (units.get(entry.piece.rarity) ?? 0) + entry.available);
      total += entry.available;
    }
    if (total === 0) return [];

    // Commonest first, so the bars read as a descending staircase and the
    // chase you are actually here for is the short one at the bottom. A tier
    // with nothing left is not listed, the same rule the shelf follows.
    const order = [...RARITY_ORDER].reverse();
    return order.filter((r) => (units.get(r) ?? 0) > 0).map((rarity) => ({
      rarity,
      share: units.get(rarity)! / total,
    }));
  }, [shelf]);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {rows.map(({ rarity, share }) => (
        <div
          key={rarity}
          className="flex items-center gap-3 text-[13px]"
        >
          <span className="w-[4.5rem] shrink-0 truncate text-muted">
            {RARITY_LABEL[rarity]}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
            {/* A floor of 3%, so a one-of-one chase still shows a mark rather
                than an empty track that reads as "none". */}
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(share * 100, 3)}%`,
                background: RARITY_COLOR[rarity],
              }}
            />
          </span>
          <span className="w-14 shrink-0 text-right font-mono text-[12px] text-muted">
            {formatOdds(share)}
          </span>
        </div>
      ))}
    </div>
  );
}


function CheckoutSheet({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { account, refresh } = useAccount();
  const coins = account?.coins ?? 0;
  const price = product ? coinPrice(product.priceCents) : 0;
  const [busy, setBusy] = useState(false);
  // Defaults to a card even when the balance would cover it. Coins are the
  // scarcer of the two and spending them should be a thing somebody chose,
  // not a default they have to notice and undo.
  const [withCoins, setWithCoins] = useState(false);
  useEffect(() => {
    setWithCoins(false);
    setError(null);
  }, [product?.id]);
  const [error, setError] = useState<string | null>(null);

  // The sheet is fixed to the bottom of the screen; this is what stops the
  // shop sliding around behind it.
  useScrollLock(product !== null);

  const buy = async () => {
    if (!product || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id, pay: withCoins ? "coins" : "card" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not complete the purchase");
      // The balance in the header is now wrong by the price of a box.
      if (withCoins) void refresh();
      router.push(`/open/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={busy ? undefined : onClose}
        >
          <motion.div
            role="dialog"
            aria-label={`Buy ${product.name}`}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl border border-hairline bg-ink-raised p-6 sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                <p className="mt-1 text-sm text-muted">{product.tagline}</p>
              </div>
              <p className="font-mono text-lg">
                <Price cents={product.priceCents} />
              </p>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-hairline bg-ink px-4 py-3">
              <span className="text-[11px] uppercase tracking-[0.16em] text-faint">
                Buying as
              </span>
              <span className="truncate text-sm text-chalk">{account?.email}</span>
            </div>

            <button
              type="button"
              onClick={buy}
              disabled={busy || (withCoins && coins < price)}
              /* Same finish as the card's "Buy a box", for the same reason:
                 this is the press that spends the money, so it should read as
                 the most object-like thing on the sheet. It drops while the
                 charge is in flight — a button shimmering at you is asking to
                 be pressed, and this one is already busy. */
              className={`mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-ink transition-transform disabled:opacity-60 ${
                busy ? "" : "gloss hover:scale-[1.01] active:scale-[0.99]"
              }`}
              style={{ background: product.accent }}
            >
              {busy ? (
                "Ripping…"
              ) : withCoins ? (
                <span className="inline-flex items-center gap-2">
                  Rip · <Coins amount={price} size={17} />
                </span>
              ) : (
                `Rip · $${(product.priceCents / 100).toFixed(2)}`
              )}
            </button>

            {/*
              The coin option only appears to somebody who could actually use
              it. Offering "pay with coins" to a collector with none is an
              advertisement dressed as a control, and it would be disabled the
              first hundred times anybody saw it.

              When they have some but not enough, it still shows — greyed, with
              the shortfall — because that is information, not noise: it says
              how much closer one more trade-in would get them.
            */}
            {coins > 0 && (
              <button
                type="button"
                onClick={() => setWithCoins((v) => !v)}
                disabled={busy}
                className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs transition-colors ${
                  withCoins
                    ? "border-amber-300/60 bg-amber-300/10 text-amber-200"
                    : "border-hairline text-muted hover:border-white/30 hover:text-chalk"
                }`}
              >
                {withCoins ? "Paying with coins" : "Pay with coins"}
                <span className="text-faint">·</span>
                {/* What the box costs in coins, not what you hold: this is a
                    price on a button, and your balance is already in the
                    header. */}
                <Coins amount={price} size={13} />
                {coins < price && (
                  <span className="text-faint">— {price - coins} short</span>
                )}
              </button>
            )}

            {/*
              Short, and about to be stuck. The button above is disabled and
              without this the sheet is a dead end — so the gap itself is
              offered, rounded up to something worth charging a card for.
              Only when they chose coins: pushing a top-up at somebody who was
              about to pay with a card is selling them a second thing.
            */}
            {withCoins && coins < price && (
              <div className="mt-3">
                <BuyCoins
                  suggested={topUpFor(price - coins)}
                  compact
                  onBought={() => setError(null)}
                />
              </div>
            )}

            {error && <p className="mt-3 text-center text-xs text-rose-400">{error}</p>}

            <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">
              Demo checkout — no card is collected and nothing is charged. Your piece is
              drawn server-side the moment the box is sealed, against the published rates.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
