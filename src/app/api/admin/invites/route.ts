import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { backend } from "@/lib/db";
import { inviteOnly, normaliseInvite, setInviteOnly } from "@/lib/invites";

/** The invite list and whether it is being enforced. Admins only, every method. */
async function state() {
  const [on, invites] = await Promise.all([inviteOnly(), backend().listInvites()]);
  return { inviteOnly: on, invites };
}

const refuse = () => NextResponse.json({ error: "Not authorised" }, { status: 401 });

async function body(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await request.json();
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  if (!(await isAdmin())) return refuse();
  return NextResponse.json(await state());
}

/** Adds an email address or phone number. */
export async function POST(request: Request) {
  if (!(await isAdmin())) return refuse();
  const entry = normaliseInvite((await body(request))?.entry);
  if (!entry) {
    return NextResponse.json(
      { error: "Enter an email address or a phone number" },
      { status: 400 },
    );
  }
  await backend().addInvite(entry);
  return NextResponse.json(await state());
}

/** Takes one off. They can't sign in again; a session they already have stays. */
export async function DELETE(request: Request) {
  if (!(await isAdmin())) return refuse();
  const entry = (await body(request))?.entry;
  if (typeof entry !== "string" || entry === "") {
    return NextResponse.json({ error: "Nothing to remove" }, { status: 400 });
  }
  await backend().removeInvite(entry);
  return NextResponse.json(await state());
}

/** Switches invite-only on or off. */
export async function PATCH(request: Request) {
  if (!(await isAdmin())) return refuse();
  const on = (await body(request))?.inviteOnly;
  if (typeof on !== "boolean") {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }
  await setInviteOnly(on);
  return NextResponse.json(await state());
}
