"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The app's pages, along the bottom of the screen.
 *
 * At the bottom rather than in the header because this is used one-handed on
 * a phone, and the top of a phone screen is the one place a thumb cannot
 * reach. Five tabs, which is as many as fit at 360px wide with their labels
 * still readable — a sixth would need labels dropped, and icons alone make
 * people guess.
 */
const TABS: { href: string; label: string; icon: ReactNode; match: (path: string) => boolean }[] = [
  {
    href: "/",
    label: "Boxes",
    match: (p) => p === "/",
    icon: (
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4" />
    ),
  },
  {
    href: "/stock",
    label: "Current stock",
    match: (p) => p.startsWith("/stock"),
    icon: (
      <path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" />
    ),
  },
  {
    href: "/collection",
    label: "Vault",
    match: (p) => p.startsWith("/collection"),
    icon: (
      <>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 8.8V7M12 17v-1.8M15.2 12H17M7 12h1.8" />
      </>
    ),
  },
  {
    href: "/rewards",
    label: "Rewards",
    match: (p) => p.startsWith("/rewards"),
    icon: (
      <>
        <rect x="3.5" y="8" width="17" height="4" rx="1" />
        <path d="M5 12v7.5h14V12M12 8v11.5M12 8c-1.6-3.4-5.5-3.6-5.5-1.3C6.5 8 9 8 12 8Zm0 0c1.6-3.4 5.5-3.6 5.5-1.3C17.5 8 15 8 12 8Z" />
      </>
    ),
  },
  {
    href: "/wallet",
    label: "Wallet",
    match: (p) => p.startsWith("/wallet"),
    icon: (
      <>
        <path d="M5.5 7.5 15.8 4.6a1.5 1.5 0 0 1 1.9 1.4v1.5" />
        <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
        <path d="M20.5 11.5h-3.2a2 2 0 0 0 0 4h3.2" />
      </>
    ),
  },
];

export function TabBar() {
  const path = usePathname() ?? "/";

  // Not while a box is being opened. That screen is the one moment the app
  // takes the whole phone, its layout is measured to put the buttons at the
  // bottom edge, and a bar across them would sit on top of "Open another".
  if (path.startsWith("/open/")) return null;

  return (
    <>
      {/* The bar is fixed, so it takes no room of its own; this does, so the
          end of every page can scroll clear of it instead of hiding under it. */}
      <div aria-hidden className="h-[calc(4.25rem+env(safe-area-inset-bottom))]" />

      <nav
        aria-label="Pages"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline/70 bg-ink/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <ul className="mx-auto flex h-[4.25rem] w-full max-w-xl items-stretch px-1">
          {TABS.map((tab) => {
            const on = tab.match(path);
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={on ? "page" : undefined}
                  className={`flex h-full flex-col items-center justify-center gap-1 transition-colors ${
                    on ? "text-chalk" : "text-faint hover:text-muted"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={on ? 1.9 : 1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {tab.icon}
                  </svg>
                  <span className="whitespace-nowrap text-[10.5px] font-medium leading-none">
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
