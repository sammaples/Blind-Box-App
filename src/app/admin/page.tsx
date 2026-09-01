import Link from "next/link";
import { AdminConsole } from "@/components/AdminConsole";
import { AdminLogin } from "@/components/AdminLogin";
import { adminMode, isAdmin } from "@/lib/admin";
import { ALL_PIECES } from "@/lib/catalog";
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
          Set an <code className="font-mono text-chalk">ADMIN_PASSWORD</code> environment
          variable and restart to enable it. Without one, the console refuses to load in
          production rather than leaving inventory editable by anyone who finds the URL.
        </p>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell>
        <AdminLogin />
      </Shell>
    );
  }

  const [rows, audit] = await Promise.all([warehouse(), recentAudit()]);
  const stock = Object.fromEntries(
    rows.map((row) => [row.piece.id, { stocked: row.stocked, sold: row.sold }]),
  );

  return (
    <AdminConsole
      // The full reference catalogue, so anything can be brought onto a shelf.
      pieces={ALL_PIECES.map((p) => ({
        id: p.id,
        name: p.name,
        setName: p.setName,
        series: p.series,
        scale: p.scale,
        rarity: p.rarity,
        pattern: p.pattern,
        palette: p.palette,
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
