import Link from "next/link";
import { BearbrickArt } from "@/components/BearbrickArt";
import { RarityChip } from "@/components/ui";
import { formatOdds, getPiece, getProduct, RARITY_ORDER } from "@/lib/catalog";
import { oddsFromSnapshot } from "@/lib/serialize";
import { readCollectorId } from "@/lib/session";
import { listOrders } from "@/lib/store";
import type { Piece } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  paid: "Sealed — not opened yet",
  revealed: "Opened · awaiting address",
  packing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default async function CollectionPage() {
  const collectorId = await readCollectorId();
  const orders = collectorId ? await listOrders(collectorId) : [];

  const pulls = orders.flatMap((order) => {
    if (order.status === "paid") return [];
    const piece = getPiece(order.pieceId);
    if (!piece) return [];
    // The rate this piece had on the shelf it came off, not on today's shelf.
    const odds = oddsFromSnapshot(order.poolSnapshot ?? [], order.pieceId);
    return [{ order, piece, odds }];
  });

  const sealed = orders.filter((o) => o.status === "paid");
  const best = [...pulls].sort(
    (a, b) => RARITY_ORDER.indexOf(a.piece.rarity) - RARITY_ORDER.indexOf(b.piece.rarity),
  )[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">My pulls</h1>
      <p className="mt-2 text-sm text-muted">
        Everything you have opened, and where each physical piece is up to.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-3">
        <Stat label="Boxes opened" value={String(pulls.length)} />
        <Stat label="Sealed, unopened" value={String(sealed.length)} />
        <Stat
          label="Best pull"
          value={best ? best.piece.name : "—"}
          sub={best ? formatOdds(best.odds) : undefined}
        />
      </dl>

      {sealed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">
            Waiting to be opened
          </h2>
          <div className="mt-4 space-y-2">
            {sealed.map((order) => (
              <Link
                key={order.id}
                href={`/open/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-ink-card px-5 py-4 transition-colors hover:border-white/25"
              >
                <div>
                  <p className="text-sm font-medium">
                    {getProduct(order.productId)?.name ?? order.productId}
                  </p>
                  <p className="mt-0.5 text-xs text-faint">
                    Sealed {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-chalk px-4 py-2 text-xs font-semibold text-ink">
                  Open it
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-faint">
          Opened
        </h2>

        {pulls.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-hairline p-12 text-center">
            <p className="text-sm text-muted">Nothing opened yet.</p>
            <Link
              href="/#shop"
              className="mt-4 inline-block rounded-full bg-chalk px-6 py-3 text-sm font-semibold text-ink"
            >
              Buy your first box
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pulls.map(({ order, piece, odds }) => (
              <PullRow
                key={order.id}
                piece={piece}
                odds={odds}
                status={order.status}
                tracking={order.trackingNumber}
                needsAddress={order.shipping === null}
                orderId={order.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-ink-card p-5">
      <dt className="text-[11px] uppercase tracking-[0.16em] text-faint">{label}</dt>
      <dd className="mt-2 truncate text-lg font-semibold">{value}</dd>
      {sub && <p className="mt-0.5 font-mono text-xs text-muted">{sub}</p>}
    </div>
  );
}

function PullRow({
  piece,
  odds,
  status,
  tracking,
  needsAddress,
  orderId,
}: {
  piece: Piece;
  odds: number;
  status: string;
  tracking: string | null;
  needsAddress: boolean;
  orderId: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-hairline bg-ink-card p-4">
      <div
        className="grid size-24 shrink-0 place-items-center rounded-xl"
        style={{
          background: `radial-gradient(120% 90% at 50% 12%, ${piece.palette.wash}, #0b0b10 78%)`,
        }}
      >
        <BearbrickArt
          uid={`coll-${piece.id}`}
          palette={piece.palette}
          pattern={piece.pattern}
          className="h-20 w-auto"
          title={piece.name}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{piece.name}</p>
        <p className="mt-0.5 truncate text-xs text-faint">{piece.setName}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <RarityChip rarity={piece.rarity} />
          <span className="font-mono text-[11px] text-muted">{formatOdds(odds)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">{STATUS_LABEL[status] ?? status}</p>
        {tracking && (
          <p className="mt-0.5 font-mono text-[11px] text-faint">{tracking}</p>
        )}
        {needsAddress && (
          <Link
            href={`/open/${orderId}`}
            className="mt-2 inline-block text-xs font-medium text-orange-400 hover:text-orange-300"
          >
            Add a shipping address →
          </Link>
        )}
      </div>
    </div>
  );
}
