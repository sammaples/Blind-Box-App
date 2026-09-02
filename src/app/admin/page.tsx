import Link from "next/link";
import { AdminConsole } from "@/components/AdminConsole";
import { AdminSignIn } from "@/components/AdminSignIn";
import { adminMode, checkAdmin } from "@/lib/admin";
import { allPieces } from "@/lib/pieces";
import { recentAudit, warehouse } from "@/lib/stock";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventory — Blind Box",
  // Nothing here should be indexed even if the URL leaks.
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const mode = adminMode();
  const access = await checkAdmin();

  if (!access.ok) {
    // The three reasons need three different answers. Telling someone to sign
    // in when they already are, or offering a sign-in form for a console that
    // is switched off entirely, sends them round a loop that cannot end.
    return <Shell>{denial(access.reason, mode === "bootstrap")}</Shell>;
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
      bootstrapAccess={mode === "bootstrap"}
    />
  );
}

function denial(
  reason: "disabled" | "signed-out" | "not-admin",
  bootstrap: boolean,
): React.ReactNode {
  if (reason === "signed-out") return <AdminSignIn devHint={bootstrap} />;

  if (reason === "disabled") {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Console is switched off</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          List the addresses that should administer this shop in{" "}
          <code className="font-mono text-chalk">ADMIN_EMAILS</code> and restart. Without
          that, the console refuses to load in production rather than leaving inventory
          editable by anyone who finds the URL.
        </p>
        <BackHome />
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Not an admin account</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You are signed in, but this address is not on the admin list. Add it to{" "}
        <code className="font-mono text-chalk">ADMIN_EMAILS</code> and sign in once more
        — admin is applied at sign-in, so a newly listed address needs one fresh sign-in
        before it takes effect.
      </p>
      <BackHome />
    </>
  );
}

function BackHome() {
  return (
    <Link
      href="/"
      className="mt-6 inline-block rounded-full bg-chalk px-6 py-3 text-sm font-semibold text-ink"
    >
      Back to the shop
    </Link>
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
