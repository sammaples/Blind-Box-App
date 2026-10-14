import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, hasAccess } from "@/lib/access";

/**
 * The tester gate, in front of every page and API call (see lib/access.ts).
 *
 * A page without a pass goes to /access, carrying where it was headed; an API
 * call without one is refused. The gate's own page and the one call it makes
 * are let through, and so are the files a phone needs to install the app.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const pass = request.cookies.get(ACCESS_COOKIE)?.value;
  const open = hasAccess(pass);

  if (pathname === "/access") {
    // Already in: nothing to do here.
    return open ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (pathname === "/api/access" || open) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Enter the access code first" }, { status: 401 });
  }
  const to = new URL("/access", request.url);
  if (pathname !== "/" || search) to.searchParams.set("next", pathname + search);
  return NextResponse.redirect(to);
}

export const config = {
  matcher: [
    // Everything but build output, the install files and public assets.
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|manifest\\.webmanifest|icon-192\\.png|icon-512\\.png|sounds/|collections/|catalogue-template\\.csv).*)",
  ],
};
