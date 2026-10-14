"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders its children everywhere except the access-code page, which stands
 * alone: no header, no tab bar, no welcome cards in front of it.
 */
export function NotOnGate({ children }: { children: ReactNode }) {
  return usePathname() === "/access" ? null : <>{children}</>;
}
