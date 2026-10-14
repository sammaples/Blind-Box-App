import type { Metadata } from "next";
import { AccessGate } from "@/components/AccessGate";
import { safeNext } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Blind Box",
  description: "Enter the access code to try Blind Box.",
};

/** The tester gate's door. The proxy sends everyone here until they have a pass. */
export default async function AccessPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AccessGate next={safeNext(next)} />;
}
