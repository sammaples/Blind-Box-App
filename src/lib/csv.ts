import { CATEGORY_ORDER, LEGACY_RARITY, toCategory } from "./catalog";
import type { Rarity, Scale, Tier } from "./types";
import { parseCoinValue } from "./coins";
import { DEFAULT_LINE, getLine, LINES, toLine } from "./lines";
import { buildPiece, RARITIES, SCALES, TIERS } from "./pieces";
import type { Piece } from "./types";

/**
 * Catalogue import from a spreadsheet.
 *
 * Written to be forgiving about the things people actually get wrong — header
 * casing, spaces versus underscores, "100" instead of "100%", a stray blank
 * line — and strict about the things that would corrupt the shop, like an
 * unknown scale or a missing name.
 */

/* ------------------------------- parsing -------------------------------- */

/** A minimal RFC 4180 reader: quoted fields, escaped quotes, embedded lines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  // Strip a BOM, which spreadsheet exports leave on the first header.
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop rows that are entirely empty, which trailing newlines produce.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/* ------------------------------- mapping -------------------------------- */

const HEADER_ALIASES: Record<string, string> = {
  id: "id",
  sku: "id",
  name: "name",
  title: "name",
  piece: "name",
  set: "set",
  setname: "set",
  // "Collection" is the kind of collectible now — Bearbrick, Pop Mart,
  // Squishy — because that is what the shop calls it everywhere. It used to
  // be a second word for the set; a sheet that means the set says "set".
  collection: "line",
  line: "line",
  brand: "line",
  collectible: "line",
  producttype: "line",
  series: "series",
  category: "category",
  kind: "category",
  type: "category",
  scale: "scale",
  size: "scale",
  rarity: "rarity",
  // "tier" used to be a second word for rarity here. It now names the box a
  // piece is sold in, which is the more consequential of the two — put it on
  // the wrong row and a grail goes out in the cheap box — so it takes the
  // column, and rarity keeps "grade" for anyone who wants a synonym.
  grade: "rarity",
  tier: "tier",
  box: "tier",
  boxtier: "tier",
  image: "image",
  imageurl: "image",
  photo: "image",
  notes: "notes",
  description: "notes",
  blurb: "notes",
  coins: "coins",
  coin: "coins",
  coinvalue: "coins",
  coinsvalue: "coins",
  tradevalue: "coins",
  tradein: "coins",
  tradeinvalue: "coins",
  value: "coins",
  quantity: "quantity",
  qty: "quantity",
  stock: "quantity",
  units: "quantity",
};

function normaliseHeader(value: string): string | null {
  const key = value.trim().toLowerCase().replace(/[\s_-]/g, "");
  return HEADER_ALIASES[key] ?? null;
}

function normaliseScale(value: string): Scale | null {
  const v = value.trim().toLowerCase().replace(/\s/g, "");
  // The combo first, in any of the ways a spreadsheet might spell it.
  const pair = v.replace(/%/g, "").replace(/[+&,]|and/g, "/");
  if (pair === "400/100" || pair === "100/400" || v === "combo") return "400%/100%";
  if (v === "100" || v === "100%" || v === "1x") return "100%";
  if (v === "200" || v === "200%" || v === "2x") return "200%";
  if (v === "400" || v === "400%" || v === "4x") return "400%";
  if (v === "1000" || v === "1000%" || v === "10x") return "1000%";
  return null;
}

/** Which box the piece is sold in. The column that decides what it competes with. */
function normaliseTier(value: string): Tier | null {
  const v = value.trim().toLowerCase().replace(/[\s_-]/g, "").replace(/box$/, "");
  return (TIERS as readonly string[]).includes(v) ? (v as Tier) : null;
}

/**
 * Reads a tier, including the six older names.
 *
 * Someone's spreadsheet says "uncommon" because that is what this shop used to
 * call things. Rejecting the row over a word we retired would make them edit a
 * file to say something they never chose; it maps instead.
 */
function normaliseRarity(value: string): Rarity | null {
  const v = value.trim().toLowerCase().replace(/[\s_-]/g, "");
  if (v === "") return "common";
  return LEGACY_RARITY[v] ?? null;
}

export interface ImportRow {
  piece: Piece;
  /** Units to stock. Undefined means "leave stock alone". */
  quantity?: number;
}

export interface ImportResult {
  rows: ImportRow[];
  /** One message per rejected line, naming the line number. */
  errors: string[];
  /** Recognised column names, so the console can show what it understood. */
  columns: string[];
}

export const CSV_TEMPLATE =
  // Carries a category column because a numbered series piece is rejected
  // without one — a template that fails its own import is worse than none.
  // No coins column: pieces are not traded in for coins any more. A sheet
  // that still has one imports fine; the column is read and kept, not used.
  "collection,name,set,series,tier,scale,rarity,category,image,quantity,notes\n" +
  "Be@rbrick,Sky Blue Bear,Series 47,47,bronze,100%,common,cute,https://example.com/sky.jpg,12,Gloss finish\n" +
  "Be@rbrick,Chrome Grail,400% Collection,,diamond,400%,chase,,https://example.com/chrome.jpg,1,One of one\n" +
  "Pop Mart,Pink Dreamer,Spring Series,,bronze,,common,,https://example.com/pink.jpg,10,\n" +
  "Squishy,Mint Mochi Cat,,,silver,,rare,,https://example.com/mochi.jpg,6,Slow rise\n" +
  "TapCap,Sunny Cap,,,gold,,ultra,,https://example.com/sunny.jpg,3,\n";

/**
 * Reads a catalogue spreadsheet. Every row is validated independently: a bad
 * line is reported by number and skipped, so one typo does not lose an upload.
 */
export function importCatalogue(text: string): ImportResult {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { rows: [], errors: ["That file has no rows in it."], columns: [] };
  }

  const header = rows[0].map(normaliseHeader);
  const columns = header.filter((h): h is string => h !== null);

  if (!columns.includes("name")) {
    return {
      rows: [],
      errors: [
        "No 'name' column found. The first row must be a header — name and tier are required (and scale for Be@rbrick).",
      ],
      columns,
    };
  }
  if (!columns.includes("tier")) {
    return {
      rows: [],
      errors: [
        "No 'tier' column found. Each piece needs the box it is sold in: " +
          "bronze, silver, gold or diamond. If your sheet uses 'tier' to mean " +
          "how rare a piece is, rename that column to 'rarity'.",
      ],
      columns,
    };
  }

  const out: ImportRow[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const line = i + 1;
    const cells = rows[i];
    const get = (key: string): string => {
      const at = header.indexOf(key);
      return at >= 0 && at < cells.length ? cells[at].trim() : "";
    };

    const name = get("name");
    if (name === "") {
      errors.push(`Line ${line}: no name, so the row was skipped.`);
      continue;
    }

    // Which collection. A blank cell, or no column at all, is Bearbrick —
    // every sheet written before collections existed is a Bearbrick sheet.
    const lineRaw = get("line");
    const lineId = lineRaw === "" ? DEFAULT_LINE : toLine(lineRaw);
    if (!lineId) {
      errors.push(
        `Line ${line}: "${lineRaw}" is not a collection — use ${LINES.map((l) => l.name).join(", ")}.`,
      );
      continue;
    }
    const sized = getLine(lineId)?.sized ?? true;

    // Sizes are a Bearbrick thing. A Pop Mart or Squishy row can leave the
    // column out; it is stored as the base size and never shown.
    const scale = normaliseScale(get("scale")) ?? (sized ? null : "100%");
    if (!scale) {
      errors.push(
        `Line ${line}: "${get("scale")}" is not a scale — use 100%, 400% or 400%/100%.`,
      );
      continue;
    }

    const tier = normaliseTier(get("tier"));
    if (!tier) {
      errors.push(
        `Line ${line}: "${get("tier")}" is not a box — use bronze, silver, gold or diamond.`,
      );
      continue;
    }

    const rarity = normaliseRarity(get("rarity"));
    if (!rarity) {
      errors.push(
        `Line ${line}: "${get("rarity")}" is not a rarity — use ${RARITIES.join(", ")}.`,
      );
      continue;
    }

    const categoryRaw = get("category");
    const category = toCategory(categoryRaw);
    if (categoryRaw !== "" && category === null) {
      errors.push(
        `Line ${line}: "${categoryRaw}" is not a category — use ${CATEGORY_ORDER.join(", ")}.`,
      );
      continue;
    }

    const seriesRaw = get("series");
    const series = seriesRaw === "" ? null : Number(seriesRaw);
    if (series !== null && !Number.isFinite(series)) {
      errors.push(`Line ${line}: "${seriesRaw}" is not a series number.`);
      continue;
    }

    const quantityRaw = get("quantity");
    let quantity: number | undefined;
    if (quantityRaw !== "") {
      const parsed = Number(quantityRaw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors.push(`Line ${line}: "${quantityRaw}" is not a quantity.`);
        continue;
      }
      quantity = Math.trunc(parsed);
    }

    // Blank means "no opinion", not zero — a sheet with an empty coins column
    // should leave every piece on the rarity ladder rather than making the
    // whole catalogue worthless. Only a value that is present and unreadable
    // is an error.
    const coinsRaw = get("coins");
    const coinValue = parseCoinValue(coinsRaw);
    if (coinValue === undefined) {
      errors.push(`Line ${line}: "${coinsRaw}" is not a coin value.`);
      continue;
    }

    // Categories (flag, cute, jellybean...) are Bearbrick's, so only a
    // Bearbrick series piece has to have one.
    if (series !== null && category === null && lineId === DEFAULT_LINE) {
      errors.push(`Line ${line}: "${name}" is a series piece, so it needs a category.`);
      continue;
    }

    const piece = buildPiece({
      // Left to buildPiece when blank, which names it after its collection
      // too, so a Pop Mart and a Bearbrick piece of the same name never meet.
      id: get("id") || undefined,
      line: lineId,
      name,
      setName: get("set"),
      series,
      scale,
      tier,
      rarity,
      category,
      imageUrl: get("image"),
      notes: get("notes"),
      coinValue,
    });

    if (seen.has(piece.id)) {
      errors.push(
        `Line ${line}: "${name}" repeats a piece already in this file — the later row wins.`,
      );
    }
    seen.add(piece.id);

    // A later duplicate replaces the earlier one, matching the message above.
    const existing = out.findIndex((r) => r.piece.id === piece.id);
    if (existing >= 0) out[existing] = { piece, quantity };
    else out.push({ piece, quantity });
  }

  return { rows: out, errors, columns };
}

export { SCALES };
