#!/usr/bin/env node
/**
 * Checks the environment a production deploy is about to run in.
 *
 * Every one of these fails at a different, unhelpful moment otherwise: a
 * missing DATABASE_URL as a stack trace about a file path, an unmigrated
 * database as a 500 on the home page, a half-configured mail provider as a
 * "check your email" for a message nobody sent. Finding out here costs
 * seconds; finding out from the deploy costs a round trip and, if anyone is
 * looking at the shop, their impression of it.
 *
 *   npm run preflight
 *
 * Reads the same variables the app does, so run it with the same environment.
 */

import { readFileSync } from "node:fs";

const problems = [];
const warnings = [];
const notes = [];

const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const amber = (t) => `\x1b[33m${t}\x1b[0m`;
const dim = (t) => `\x1b[2m${t}\x1b[0m`;

/* --------------------------- session signing --------------------------- */

const secret = process.env.AUTH_SECRET;
if (!secret) {
  problems.push([
    "AUTH_SECRET is not set",
    "Session cookies are signed with it. Without one the app refuses to sign\n" +
      "  anyone in rather than falling back to a key published in the source.\n" +
      "  Generate one with:  openssl rand -hex 32",
  ]);
} else if (secret.length < 32) {
  problems.push([
    "AUTH_SECRET is too short",
    `It is ${secret.length} characters. Use at least 32 — openssl rand -hex 32.`,
  ]);
} else {
  notes.push("AUTH_SECRET set");
}

/* ------------------------------- storage ------------------------------- */

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  problems.push([
    "DATABASE_URL is not set",
    "The JSON file backend cannot survive a deploy and on most hosts cannot\n" +
      "  even be written to. Point this at Postgres.",
  ]);
} else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
  problems.push(["DATABASE_URL is not a Postgres URL", `Got: ${databaseUrl.slice(0, 24)}…`]);
} else {
  notes.push("DATABASE_URL set");
}

/* -------------------------------- admin -------------------------------- */

const admins = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
if (admins.length === 0) {
  problems.push([
    "ADMIN_EMAILS is not set",
    "Without it the inventory console refuses to load in production — which is\n" +
      "  the safe default, but it means you cannot manage stock. List the\n" +
      "  addresses that should administer the shop, comma separated.",
  ]);
} else if (admins.some((a) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a))) {
  problems.push([
    "ADMIN_EMAILS has an entry that is not an email address",
    `Parsed: ${admins.join(", ")}`,
  ]);
} else {
  notes.push(`ADMIN_EMAILS set (${admins.length})`);
}

/* --------------------------------- mail -------------------------------- */

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;
if (!apiKey && !from) {
  problems.push([
    "No email provider configured",
    "Sign-in is by emailed link, so without one nobody can sign in — including\n" +
      "  you. Set RESEND_API_KEY and EMAIL_FROM.",
  ]);
} else if (!apiKey || !from) {
  problems.push([
    "Email provider is half configured",
    `${apiKey ? "RESEND_API_KEY is set but EMAIL_FROM is not" : "EMAIL_FROM is set but RESEND_API_KEY is not"}.\n` +
      "  Both are needed, and EMAIL_FROM must be on a domain verified with Resend.",
  ]);
} else {
  notes.push("Email provider configured");
  if (!/@/.test(from)) {
    warnings.push(`EMAIL_FROM does not contain an address: ${from}`);
  }
}

/* ------------------------- migrations on disk -------------------------- */

let migrationCount = 0;
try {
  const { readdirSync } = await import("node:fs");
  migrationCount = readdirSync(new URL("../migrations", import.meta.url)).filter((f) =>
    f.endsWith(".sql"),
  ).length;
  notes.push(`${migrationCount} migrations present`);
} catch {
  warnings.push("Could not read the migrations directory");
}

/* --------------------------- database reachable ------------------------ */

if (databaseUrl && /^postgres(ql)?:\/\//.test(databaseUrl)) {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: databaseUrl,
      // A hosted database that is not reachable should say so quickly rather
      // than hanging a deploy check for thirty seconds.
      connectionTimeoutMillis: 8000,
      ssl: /localhost|127\.0\.0\.1|host=/.test(databaseUrl)
        ? undefined
        : { rejectUnauthorized: false },
    });
    const { rows } = await pool.query(
      "select table_name from information_schema.tables where table_schema = 'public'",
    );
    const tables = new Set(rows.map((r) => r.table_name));
    const required = ["collectors", "catalog_pieces", "stock", "orders", "audit"];
    const missing = required.filter((t) => !tables.has(t));

    if (tables.size === 0) {
      problems.push([
        "The database is empty",
        "Run `npm run migrate` against it before starting the app.",
      ]);
    } else if (missing.length > 0) {
      problems.push([
        `The database is missing ${missing.join(", ")}`,
        "Run `npm run migrate` — it is probably behind by a migration or two.",
      ]);
    } else {
      const applied = await pool
        .query("select count(*)::int as n from pgmigrations")
        .then((r) => r.rows[0].n)
        .catch(() => null);
      notes.push(
        `Database reachable, schema present` +
          (applied !== null ? ` (${applied}/${migrationCount} migrations applied)` : ""),
      );
      if (applied !== null && migrationCount > 0 && applied < migrationCount) {
        problems.push([
          `The database is ${migrationCount - applied} migration(s) behind`,
          "Run `npm run migrate`.",
        ]);
      }
    }
    await pool.end();
  } catch (err) {
    problems.push([
      "Could not reach the database",
      String(err instanceof Error ? err.message : err),
    ]);
  }
}

/* -------------------------------- payments ------------------------------ */

try {
  const payments = readFileSync(new URL("../src/lib/payments.ts", import.meta.url), "utf8");
  if (/mock|stub|always succeeds/i.test(payments) && !process.env.STRIPE_SECRET_KEY) {
    warnings.push(
      "Payments are still the mock provider — orders will complete and nothing\n" +
        "  will be charged. Fine for a soft launch, not for taking money.",
    );
  }
} catch {
  // Not fatal; the file may have been replaced entirely.
}

/* --------------------------------- report ------------------------------- */

console.log("");
for (const n of notes) console.log(`  ${green("ok")}    ${n}`);
for (const w of warnings) console.log(`  ${amber("warn")}  ${w}`);
for (const [title, detail] of problems) {
  console.log(`  ${red("fail")}  ${title}`);
  console.log(dim(`        ${detail.replace(/\n/g, "\n      ")}`));
}
console.log("");

if (problems.length > 0) {
  console.log(
    red(`  ${problems.length} thing${problems.length === 1 ? "" : "s"} to fix before deploying.\n`),
  );
  process.exit(1);
}
console.log(green("  Ready to deploy.\n"));
