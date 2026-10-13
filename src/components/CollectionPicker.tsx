import Link from "next/link";
import type { CollectionCard } from "@/lib/collections";
import { CollectionBanner } from "./CollectionBanner";
import { HowItWorksButton } from "./HowItWorks";

/**
 * The collections, as thick bars stacked down the screen: tap one to open
 * its boxes.
 *
 * `fill` shares the screen's height out between the bars, for the front page,
 * which is laid out to be exactly one screen. Without it each bar is a fixed
 * height, for a page that scrolls.
 */
export function CollectionPicker({
  cards,
  title,
  hrefFor,
  help = false,
  fill = false,
}: {
  cards: CollectionCard[];
  title: string;
  /** Where a bar goes — the shop or the stock page for that collection. */
  hrefFor: (lineId: string) => string;
  /** Whether to show the "how it works" button beside the title. */
  help?: boolean;
  fill?: boolean;
}) {
  return (
    <section className={`mx-auto flex w-full max-w-3xl flex-col px-5 sm:px-8 ${fill ? "h-full min-h-0" : ""}`}>
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1
          className="shimmer-text shimmer-slow w-fit text-3xl font-semibold tracking-tight sm:text-4xl [@media(max-height:720px)]:text-2xl"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #9d9dad 0%, #f5f5f7 28%, #ffffff 46%, #ffffff 54%, #f5f5f7 72%, #9d9dad 100%)",
          }}
        >
          {title}
        </h1>
        {help && <HowItWorksButton />}
      </div>

      <ul className={`mt-4 flex flex-col gap-3 [@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:gap-2 ${fill ? "min-h-0 flex-1 pb-3" : ""}`}>
        {cards.map(({ line, coverUrl, fromCents, units }) => (
          <li key={line.id} className={fill ? "min-h-[5.75rem] flex-1 basis-0" : "h-32 sm:h-40"}>
            <Link
              href={hrefFor(line.id)}
              className="group relative flex h-full items-end overflow-hidden rounded-[26px] border border-white/10 bg-ink-card shadow-[0_14px_34px_-18px_rgba(0,0,0,0.8)] transition-transform active:scale-[0.985]"
            >
              <CollectionBanner line={line.id} coverUrl={coverUrl} />
              {/* Shade under the name, so it reads on any cover photo. */}
              <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
              <span className="relative flex w-full items-end justify-between gap-3 p-4 sm:p-5">
                <span className="min-w-0">
                  <span className="block truncate text-[26px] font-bold leading-none tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-3xl">
                    {line.name}
                  </span>
                  <span className="mt-2 inline-block rounded-full bg-black/35 px-2.5 py-1 text-[12px] font-medium text-white/90 backdrop-blur-sm">
                    {units > 0
                      ? `From $${(fromCents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                      : "Coming soon"}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform group-hover:translate-x-0.5"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
