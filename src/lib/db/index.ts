import "server-only";
import type { Backend } from "./types";
import { createJsonBackend } from "./json";
import { createPostgresBackend } from "./postgres";

/**
 * Picks the storage backend. Set DATABASE_URL and the app uses Postgres;
 * leave it unset and it falls back to the JSON file, which is what lets the
 * demo run with no setup at all.
 *
 * That fallback is refused in production, and the refusal is the point. A
 * hosted app writing its catalogue to a file gets one of two endings: the
 * filesystem is read-only and every write fails, or it is not and the file is
 * quietly discarded on the next deploy, taking the shop's inventory with it.
 * Both are worse than not starting, and neither announces itself as a storage
 * problem — you find out from a stack trace about a path, or from a catalogue
 * that is simply empty one morning.
 */

let instance: Backend | null = null;

export function backend(): Backend {
  if (instance) return instance;

  const url = process.env.DATABASE_URL;

  if (!url && process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL is not set. In production the shop needs a real database: " +
        "the JSON file backend cannot survive a deploy, and on most hosts cannot " +
        "even be written to. Point DATABASE_URL at Postgres and run " +
        "`npm run migrate` against it.",
    );
  }

  instance = url ? createPostgresBackend(url) : createJsonBackend();
  return instance;
}

export type { Backend } from "./types";
