import type { Metadata, Viewport } from "next";
import { Lobster_Two } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AccountButton,
  AccountProvider,
  AdminLink,
  CoinBalance,
} from "@/components/AccountBar";
import { Onboarding } from "@/components/Onboarding";
import "./globals.css";

/**
 * The wordmark's face — a heavy brush script, the one thing on the page that is
 * not the interface typeface. Bold italic on purpose: the weight and the lean
 * are what make it read as a painted sign rather than handwriting.
 *
 * Loaded through next/font rather than a stylesheet link: it is self-hosted at
 * build time, so the name is painted in its own face on first frame instead of
 * appearing in a fallback and then jumping. `display: swap` keeps the header
 * readable if that ever fails.
 */
const wordmark = Lobster_Two({
  weight: "700",
  style: "italic",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blind Box — open digitally, collect physically",
  description:
    "Buy a sealed collectible blind box, open it with a live pull, and have the physical piece shipped to you. Every pull rate published up front.",
};

export const viewport: Viewport = {
  themeColor: "#08080b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="ambient grain min-h-dvh antialiased">
        <AccountProvider>
          {/* First, and inside the provider.

              Inside because its last card depends on who is signed in. First
              because it is shown on every open and rendered by the server,
              and the HTML arrives in order: at the end of the body it was the
              last thing the browser parsed, so on the home page — long, and
              streamed — the shop could paint a second or two before the cover
              meant to be in front of it. It is fixed and z-indexed, so being
              first in the document changes nothing about how it stacks. */}
          <Onboarding />
          <Header />
          <main className="relative z-10">{children}</main>
          <Footer />
        </AccountProvider>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {/* The letter carries the tile, so it is set to fill it — a small
              glyph adrift in a white square reads as a placeholder. 18 on 24
              is as large as the script goes before its tail meets the edge. */}
          <span
            className={`grid size-6 place-items-center rounded-md bg-chalk pb-px text-[18px] leading-none text-ink ${wordmark.className}`}
          >
            B
          </span>
          {/* A script sits small for its point size, so it is set larger than
              the nav beside it and nudged up to share a baseline with it. */}
          <span
            className={`whitespace-nowrap text-[19px] leading-none -translate-y-px ${wordmark.className}`}
          >
            Bricks
          </span>
        </Link>
        {/* Nothing in here may wrap: a two-line header on a phone pushes the
            page down and reads as broken. So the two links that are not the
            vault go when the room runs out — "The set" is a section of the
            page you are probably already on, and "How it works" is reachable
            from the front page and the footer, which is where a phone finds
            it. What is left is the one thing only this header can do. */}
        <nav className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-sm sm:gap-1">
          <Link
            href="/how-it-works"
            className="hidden rounded-full px-3 py-1.5 text-muted transition-colors hover:text-chalk sm:inline-block"
          >
            How it works
          </Link>
          <Link
            href="/#set"
            className="hidden rounded-full px-3 py-1.5 text-muted transition-colors hover:text-chalk lg:inline-block"
          >
            The set
          </Link>
          <Link
            href="/collection"
            className="rounded-full px-2.5 py-1.5 text-muted transition-colors hover:text-chalk sm:px-3"
          >
            My vault
          </Link>
          <CoinBalance />
          <AdminLink />
          <span className="ml-0.5 sm:ml-1.5">
            <AccountButton />
          </span>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-hairline">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-10 text-xs text-faint sm:px-8">
        <p>
          Pull rates are published per piece and are the same numbers the draw runs
          against. Every order stores the seed it was drawn from.
        </p>
        <p>Demo build — checkout is simulated and nothing is charged.</p>
        {/* The nav drops "How it works" on a phone, so the footer is where a
            phone gets it back — and it is on every page, which the link on the
            front of the home page is not. */}
        <p className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
          <Link href="/how-it-works" className="transition-colors hover:text-muted">
            How it works
          </Link>
          <Link href="/admin" className="transition-colors hover:text-muted">
            Inventory console
          </Link>
        </p>
      </div>
    </footer>
  );
}
