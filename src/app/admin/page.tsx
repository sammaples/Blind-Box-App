import Link from "next/link";
import { AdminConsole } from "@/components/AdminConsole";
import { adminMode, isAdmin } from "@/lib/admin";
import { allPieces } from "@/lib/pieces";
import { recentAudit, warehouse } from "@/lib/stock";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inventory — Blind Box" };

export default async function AdminPage() {
  const mode = adminMode();

  if (mode === "disabled") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Console is switched off</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          List the addresses that should administer this shop in{" "}
          <code className="font-mono text-chalk">ADMIN_EMAILS</code> and restart. Without
          that, the console refuses to load in production rather than leaving inventory
          editable by anyone who finds the URL.
        </p>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Not your shop</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The inventory console is limited to admin accounts. Sign in with an address
          listed in <code className="font-mono text-chalk">ADMIN_EMAILS</code>, then come
          back — admin is applied at sign-in, so a newly listed address needs one fresh
          sign-in before it takes effect.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-chalk px-6 py-3 text-sm font-semibold text-ink"
        >
          Back to the shop
        </Link>
      </Shell>
    );
  }

  const [rows, audit, catalogue] = await Promise.all([
    warehouse(),
    recentAudit(),
    allPieces(),
  ]);
  const stock = Object.fromEntries(
    rows.map((row) => [row.piece.id, { stocked: row.stocked, sold: row.sold }]),
  );

  return (
    <AdminConsole
      // The shop's own catalogue, uploaded and edited here.
      pieces={catalogue.map((p) => ({
        id: p.id,
        name: p.name,
        setName: p.setName,
        series: p.series,
        scale: p.scale,
        rarity: p.rarity,
        pattern: p.pattern,
        palette: p.palette,
        imageUrl: p.imageUrl,
        archived: p.archived,
      }))}
      stock={stock}
      audit={audit}
      openAccess={mode === "open"}
    />
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg px-5 py-24 sm:px-8">
      <Link href="/" className="text-xs text-faint transition-colors hover:text-muted">
        ← Back to the shop
      </Link>
      <div className="mt-6 rounded-2xl border border-hairline bg-ink-card p-7">{children}</div>
    </div>
  );
}
