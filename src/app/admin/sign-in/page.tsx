import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OpenTestingSwitch } from "@/components/OpenTestingSwitch";
import { checkAdmin } from "@/lib/admin";
import { openTesting } from "@/lib/openTesting";

export const metadata: Metadata = {
  title: "Sign-in — Blind Box",
};

export const dynamic = "force-dynamic";

/** How people sign in. Everyone can; this says whether a code is needed. Admins only. */
export default async function SignInSettingsPage() {
  if (!(await checkAdmin()).ok) redirect("/admin");
  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
      <Link href="/" className="text-[13px] font-medium text-muted transition-colors hover:text-chalk">
        ← Shop
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Sign-in</h1>
      <OpenTestingSwitch initial={await openTesting()} />
    </div>
  );
}
