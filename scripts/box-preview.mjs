#!/usr/bin/env node
/**
 * Builds a standalone page showing the shop box turning, so an animation can
 * be looked at — and shared — without a deploy.
 *
 *   npm run preview:box
 *
 * The box on the page is not a drawing of the box. The script starts the app,
 * opens the shop, and lifts the rendered carton straight out of the DOM:
 * its faces, its print, its transforms, exactly as a visitor's browser built
 * them. That is the whole point. A hand-copied preview drifts from the
 * component the first time either one changes, and a preview that lies about
 * the thing it previews is worse than no preview.
 *
 * Two files come out, both in .preview/ and neither committed:
 *
 *   box-spin.html            open it in a browser
 *   box-spin.artifact.html   the same page without the outer document, for
 *                            hosts that supply their own
 *
 * Needs Playwright for the browser. It is not a dependency of the app — the
 * app does not need one — so it is resolved from wherever you have it:
 *
 *   npm i -D playwright && npx playwright install chromium
 */

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

/* -------------------------------- options ------------------------------- */

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const url = (option("url", "http://localhost:3000") ?? "").replace(/\/$/, "");
const outDir = resolve(root, option("out", ".preview"));

/* ------------------------------- playwright ----------------------------- */

const require = createRequire(import.meta.url);

async function loadChromium() {
  // The project's own copy first, then a global one. Global installs are the
  // common case here, because nothing else in the app wants a browser.
  const candidates = [
    "playwright",
    "playwright-core",
    "/usr/lib/node_modules/playwright/index.js",
    "/usr/local/lib/node_modules/playwright/index.js",
  ];
  for (const id of candidates) {
    try {
      return require(id).chromium;
    } catch {
      /* try the next one */
    }
  }
  const globalRoot = await new Promise((done) => {
    const p = spawn("npm", ["root", "-g"], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => done(out.trim()));
    p.on("error", () => done(""));
  });
  if (globalRoot) {
    try {
      return require(`${globalRoot}/playwright/index.js`).chromium;
    } catch {
      /* fall through to the message below */
    }
  }
  console.error(
    "\n  Playwright is not installed, and this script needs a browser to read\n" +
      "  the box out of the running app.\n\n" +
      "    npm i -D playwright && npx playwright install chromium\n",
  );
  process.exit(1);
}

/* ------------------------------ the dev server --------------------------- */

const serving = async () => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Start the app only if nothing is already answering. Someone running
 * `npm run dev` in another terminal keeps their own server, their own logs and
 * their own port — this script is not worth interrupting a session for.
 *
 * `next` is spawned directly rather than through npm, because npm does not
 * pass a signal on to what it started, and a server left holding the port is
 * the next run's EADDRINUSE.
 */
async function startedServer() {
  if (await serving()) return null;

  const port = new URL(url).port || "3000";
  const child = spawn(resolve(root, "node_modules/.bin/next"), ["dev", "--port", port], {
    cwd: root,
    stdio: "ignore",
  });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next dev exited before it served anything (code ${child.exitCode})`);
    }
    if (await serving()) return child;
    await new Promise((r) => setTimeout(r, 400));
  }
  child.kill();
  throw new Error(`${url} did not come up within a minute`);
}

/* ---------------------------- the committed rate ------------------------- */

/**
 * The page states how long a turn takes, and that number has to be the one the
 * component actually uses, so it is read back out of the source rather than
 * written down twice. It is an arithmetic expression by design — the constant
 * shows its own derivation — so it is evaluated rather than parsed. The input
 * is a file in this repository, not anything a visitor supplies.
 */
function spinSecondsFromSource() {
  const src = readFileSync(resolve(root, "src/components/Shop.tsx"), "utf8");
  const m = src.match(/const SPIN_SECONDS\s*=\s*([^;]+);/);
  if (!m) throw new Error("SPIN_SECONDS is gone from src/components/Shop.tsx");
  const value = Function(`"use strict"; return (${m[1]});`)();
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`SPIN_SECONDS did not evaluate to a duration: ${m[1]}`);
  }
  return value;
}

/* --------------------------------- build --------------------------------- */

const chromium = await loadChromium();
const spinSeconds = spinSecondsFromSource();
let server = null;

try {
  server = await startedServer();

  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${url}/#shop`, { waitUntil: "networkidle" });

  const stage = await page.evaluate(() => {
    const card = document.querySelector("#shop [style*='perspective']");
    if (!card) return null;
    const box = card.querySelector("[style*='preserve-3d']");
    const clone = box.cloneNode(true);
    // The animation library writes a live transform onto this element every
    // frame; the preview drives its own, so the captured one has to go.
    clone.style.transform = "";
    return clone.outerHTML;
  });

  await browser.close();

  if (!stage) {
    throw new Error(`No product box found at ${url}/#shop — has the shop markup moved?`);
  }

  const body = readFileSync(resolve(here, "box-preview.template.html"), "utf8")
    .replaceAll("__STAGE__", stage)
    .replaceAll("__SPIN_SECONDS__", String(Math.round(spinSeconds * 10) / 10));

  // The hosted copy goes out as a fragment, because artifact hosts wrap what
  // they are given in a document of their own. The local copy needs that
  // document, or a browser opening it off disk renders it in quirks mode.
  const standalone =
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n" +
    `</head>\n<body>\n${body}\n</body>\n</html>\n`;

  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "box-spin.html"), standalone);
  writeFileSync(resolve(outDir, "box-spin.artifact.html"), body);

  console.log(
    `\n  Built from ${url} — one turn in ${spinSeconds.toFixed(1)}s\n\n` +
      `    ${resolve(outDir, "box-spin.html")}\n` +
      `    ${resolve(outDir, "box-spin.artifact.html")}  (fragment, for an artifact host)\n`,
  );
} finally {
  server?.kill();
}
