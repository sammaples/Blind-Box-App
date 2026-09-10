import type { Metadata, Viewport } from "next";
import { Lobster_Two } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccountButton, AccountProvider, AdminLink } from "@/components/AccountBar";
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
            page down and reads as broken. "The set" is the one item that also
            exists as a section of the page you are already on, so it is the one
            that goes when the room runs out. */}
        <nav className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-sm sm:gap-1">
          <Link
            href="/#set"
            className="hidden rounded-full px-3 py-1.5 text-muted transition-colors hover:text-chalk sm:inline-block"
          >
            The set
          </Link>
          <Link
            href="/collection"
            className="rounded-full px-2.5 py-1.5 text-muted transition-colors hover:text-chalk sm:px-3"
          >
            My pulls
          </Link>
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
        <p className="pt-1">
          <Link href="/admin" className="transition-colors hover:text-muted">
            Inventory console
          </Link>
        </p>
      </div>
    </footer>
  );
}
