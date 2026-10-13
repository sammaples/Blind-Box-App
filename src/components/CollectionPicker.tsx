import Link from "next/link";
import type { CollectionCard } from "@/lib/collections";
import { CollectionArt } from "./CollectionArt";
import { HowItWorksButton } from "./HowItWorks";
import { PieceImage } from "./PieceImage";

/**
 * The collections, as a row of cards: tap one to open its boxes.
 *
 * Three across, which is what fits a phone with the pictures still big enough
 * to read; more collections wrap onto a second row of three.
 */
export function CollectionPicker({
  cards,
  title,
  hrefFor,
  help = false,
}: {
  cards: CollectionCard[];
  title: string;
  /** Where a card goes — the shop or the stock page for that collection. */
  hrefFor: (lineId: string) => string;
  /** Whether to show the "how it works" button beside the title. */
  help?: boolean;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 sm:px-8">
      <div className="flex items-center justify-between gap-3">
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

      <ul className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-4">
        {cards.map(({ line, cover, fromCents, units }) => (
          <li key={line.id}>
            <Link
              href={hrefFor(line.id)}
              className="group block overflow-hidden rounded-[20px] border border-hairline bg-ink-card transition-transform active:scale-[0.97]"
            >
              <span
                className="relative flex aspect-[3/4] items-center justify-center"
                style={{
                  background: `radial-gradient(120% 85% at 50% 18%, color-mix(in srgb, ${line.accent} 42%, transparent), #0b0b10 78%)`,
                }}
              >
                {cover ? (
                  <PieceImage
                    piece={cover}
                    className="h-[78%] w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.05]"
                  />
                ) : (
                  <CollectionArt
                    line={line.id}
                    uid={`card-${line.id}`}
                    className="h-[74%] w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.05]"
                  />
                )}
              </span>
              <span className="block px-2.5 pb-3 pt-2.5">
                <span className="block truncate text-[14px] font-semibold leading-tight">{line.name}</span>
                <span className="mt-0.5 block truncate text-[11px] text-muted">
                  {units > 0 ? (
                    <>
                      From ${(fromCents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </>
                  ) : (
                    "Coming soon"
                  )}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
