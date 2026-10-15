import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { openTesting, setOpenTesting } from "@/lib/openTesting";

/** Whether open testing is on. Admins only, both methods. */
const refuse = () => NextResponse.json({ error: "Not authorised" }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return refuse();
  return NextResponse.json({ openTesting: await openTesting() });
}

/** Switches open testing on or off. */
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return refuse();
  let on: unknown;
  try {
    on = (await request.json())?.openTesting;
  } catch {
    on = undefined;
  }
  if (typeof on !== "boolean") {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }
  await setOpenTesting(on);
  return NextResponse.json({ openTesting: await openTesting() });
}
