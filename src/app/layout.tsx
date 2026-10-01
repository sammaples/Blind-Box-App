import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccountProvider, CoinBalance } from "@/components/AccountBar";
import { Monogram } from "@/components/Monogram";
import { Onboarding } from "@/components/Onboarding";
import { ProfileButton } from "@/components/Profile";
import { NotOnHome } from "@/components/NotOnHome";
import { TabBar } from "@/components/TabBar";
import { wordmark } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blind Box — open digitally, collect physically",
  description:
    "Buy a sealed collectible blind box, open it with a live pull, and have the physical piece shipped to you. Every pull rate published up front.",
  // Added to an iPhone's home screen, it opens full screen like an app, with
  // the status bar in the app's own dark rather than Safari around it.
  appleWebApp: {
    capable: true,
    title: "Blind Box",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080b",
  // Lets the tab bar reach the bottom edge of an iPhone and pad itself above
  // the home indicator, rather than floating on a strip of browser chrome.
  viewportFit: "cover",
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
          <NotOnHome>
            <Footer />
          </NotOnHome>
          <TabBar />
        </AccountProvider>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* "Blind Box" is two words where "Bricks" was one, and on the
            narrowest phones, signed in with a coin balance showing, it met
            the nav. Below 375px the name steps down a size and the gap
            tightens; below 340px it goes altogether and the monogram carries
            the brand on its own, which is the job a monogram is for. */}
        <Link href="/" aria-label="Blind Box" className="flex shrink-0 items-center gap-2 min-[375px]:gap-2.5">
          {/* The mark carries the tile, so it is set to fill it — a small
              shape adrift in a white square reads as a placeholder. */}
          <span className="grid size-6 place-items-center rounded-md bg-chalk text-ink">
            <Monogram className="size-[21px]" />
          </span>
          {/* A script sits small for its point size, so it is set larger than
              the nav beside it and nudged up to share a baseline with it. */}
          <span
            className={`whitespace-nowrap text-[17px] leading-none -translate-y-px max-[339px]:hidden min-[375px]:text-[19px] ${wordmark.className}`}
          >
            Blind Box
          </span>
        </Link>
        {/* Pages are in the tab bar at the bottom now, where a thumb can reach
            them. What stays up here is what belongs to you rather than to a
            page: your coins, and you. Signing in and out, the console and
            the rest of the account live behind the profile button. */}
        <nav className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm">
          <CoinBalance />
          <ProfileButton />
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
