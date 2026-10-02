import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteList } from "@/components/InviteList";
import { checkAdmin } from "@/lib/admin";
import { backend } from "@/lib/db";
import { inviteOnly } from "@/lib/invites";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invites — Blind Box",
  robots: { index: false, follow: false },
};

/** Who may sign in while the shop is invite-only. Admins only. */
export default async function InvitesPage() {
  // The console already explains every way of being refused; send anyone
  // who isn't an admin there rather than saying it twice.
  if (!(await checkAdmin()).ok) redirect("/admin");

  const [on, invites] = await Promise.all([inviteOnly(), backend().listInvites()]);

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
      <Link href="/" className="text-[13px] font-medium text-muted transition-colors hover:text-chalk">
        ← Shop
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Invites</h1>
      <InviteList initial={{ inviteOnly: on, invites }} />
    </div>
  );
}
