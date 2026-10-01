/**
 * The daily spin.
 *
 * Free, once a day, and always pays something. The wheel shows fourteen
 * slots — eleven of 50 coins, two of 250, and one of 1,500 — but what it lands
 * on is decided on the server by the odds below, not by where the slots sit:
 * a slot's width on the wheel is decoration, the odds are the rule.
 *
 * Shared by the server, which draws the prize, and the page, which draws the
 * wheel, so the two cannot disagree about what is on it.
 */

/** The wheel, clockwise from the top. The jackpot sits under the pointer at rest. */
export const SPIN_SLOTS: readonly number[] = [
  1500, 50, 50, 50, 50, 250, 50, 50, 50, 250, 50, 50, 50, 50,
];

/** Chance of each prize, out of 100. */
export const SPIN_ODDS: readonly { coins: number; chance: number }[] = [
  { coins: 50, chance: 89 },
  { coins: 250, chance: 10 },
  { coins: 1500, chance: 1 },
];

/** A day is a day in the shop's own time zone, so it resets at midnight there. */
export const SPIN_TIME_ZONE = "America/New_York";

/** Today's date in the shop's time zone, as YYYY-MM-DD. */
export function spinDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SPIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** When the next spin opens: the coming midnight in the shop's time zone. */
export function nextSpinAt(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SPIN_TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000 + now.getMilliseconds();
  return new Date(now.getTime() + 24 * 3600 * 1000 - elapsed);
}

/**
 * The prize for a roll from 0 to 99.
 *
 * The caller supplies the roll so the server can use a cryptographic one and
 * a test can use a fixed one.
 */
export function prizeFor(roll: number): number {
  let edge = 0;
  for (const { coins, chance } of [...SPIN_ODDS].sort((a, b) => a.chance - b.chance)) {
    edge += chance;
    if (roll < edge) return coins;
  }
  return SPIN_ODDS[0].coins;
}

/** "5h 12m", "12m 40s" — how long until the next spin. */
export function untilLabel(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}
