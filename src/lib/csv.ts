import { LEGACY_RARITY } from "./catalog";
import type { Rarity, Scale } from "./types";
import { buildPiece, RARITIES, SCALES, slugFor } from "./pieces";
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
  collection: "set",
  series: "series",
  scale: "scale",
  size: "scale",
  rarity: "rarity",
  tier: "rarity",
  image: "image",
  imageurl: "image",
  photo: "image",
  notes: "notes",
  description: "notes",
  blurb: "notes",
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
  if (v === "100" || v === "100%" || v === "1x") return "100%";
  if (v === "400" || v === "400%" || v === "4x") return "400%";
  return null;
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
  "name,set,series,scale,rarity,image,quantity,notes\n" +
  "Sky Blue Bear,Series 47,47,100%,common,https://example.com/sky.jpg,12,Gloss finish\n" +
  "Chrome Chase,400% Collection,,400%,chase,https://example.com/chrome.jpg,1,One of one\n";

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
        "No 'name' column found. The first row must be a header — name and scale are required.",
      ],
      columns,
    };
  }
  if (!columns.includes("scale")) {
    return {
      rows: [],
      errors: ["No 'scale' column found. Each piece needs 100% or 400%."],
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

    const scale = normaliseScale(get("scale"));
    if (!scale) {
      errors.push(
        `Line ${line}: "${get("scale")}" is not a scale — use 100% or 400%.`,
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

    const piece = buildPiece({
      id: get("id") || slugFor(name, scale),
      name,
      setName: get("set"),
      series,
      scale,
      rarity,
      imageUrl: get("image"),
      notes: get("notes"),
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
