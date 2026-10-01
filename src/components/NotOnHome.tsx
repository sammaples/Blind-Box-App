"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders its children everywhere except the Boxes page.
 *
 * That page is laid out to be exactly one screen and not to scroll, so
 * anything that sits below it in the layout — the footer — would be the thing
 * that made it scroll.
 */
/** Screens laid out to fill the phone exactly, with nothing under them. */
const FULL_SCREEN = new Set(["/", "/rewards/spin"]);

export function NotOnHome({ children }: { children: ReactNode }) {
  return FULL_SCREEN.has(usePathname() ?? "") ? null : <>{children}</>;
}
