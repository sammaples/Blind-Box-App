import { NextResponse } from "next/server";
import { appleConfig, exchangeCode, nameFromCallback } from "@/lib/apple";
import { safeNext, signInWithApple, startSession, takeHandshake } from "@/lib/auth";
import { redirectUri } from "../route";

/**
 * Where Apple comes back to.
 *
 * A POST, because asking for any scope makes Apple `form_post` its answer
 * rather than putting it in a query string — which is the better shape
 * anyway: a code in a URL ends up in history and logs.
 *
 * Nothing here trusts the request. The state must match the cookie planted
 * when the handshake started, the code is exchanged server to server, and the
 * identity token that comes back is checked against Apple's own signing keys
 * before a single field of it is believed.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);

  // The handshake is read first and unconditionally, because reading it also
  // retires it: one handshake answers one callback, whether or not this one
  // turns out to be good.
  const handshake = await takeHandshake();
  const back = (reason: string) => {
    const to = new URL(safeNext(handshake?.next), url.origin);
    to.searchParams.set("signin", reason);
    return NextResponse.redirect(to, 303);
  };

  if (!form) return back("failed");

  // Someone pressing Cancel on Apple's sheet is not an error to shout about.
  if (form.get("error")) return back("cancelled");

  const config = appleConfig();
  if (!config) return back("unconfigured");
  if (!handshake) return back("expired");

  const state = form.get("state");
  if (typeof state !== "string" || state !== handshake.state) return back("failed");

  const code = form.get("code");
  if (typeof code !== "string" || code === "") return back("failed");

  try {
    const identity = await exchangeCode(config, code, redirectUri(request), handshake.nonce);
    // Offered once, on a first authorisation, and never again — so it is read
    // out of this request or it is lost.
    const account = await signInWithApple(identity, nameFromCallback(form.get("user")));
    const claimed = await startSession(account);

    const to = new URL(safeNext(handshake.next), url.origin);
    to.searchParams.set("signin", "ok");
    if (claimed > 0) to.searchParams.set("claimed", String(claimed));
    // 303, because what follows a POST should be fetched with GET.
    return NextResponse.redirect(to, 303);
  } catch (err) {
    // The detail belongs in the log, not in a query string on a page: it
    // names our configuration and would only tell a visitor things that are
    // not theirs to act on.
    console.error("[auth] Apple sign-in failed:", err);
    return back("failed");
  }
}

/**
 * Apple only ever POSTs here, so a GET is somebody arriving by hand — a
 * pasted link, a back button, a preview crawler. Send them to the front page
 * rather than showing a method-not-allowed.
 */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/", request.url));
}
