import "server-only";
import type { Backend } from "./types";
import { createJsonBackend } from "./json";
import { createPostgresBackend } from "./postgres";

/**
 * Picks the storage backend. Set DATABASE_URL and the app uses Postgres;
 * leave it unset and it falls back to the JSON file, which is what lets the
 * demo run with no setup at all.
 */

let instance: Backend | null = null;

export function backend(): Backend {
  if (instance) return instance;

  const url = process.env.DATABASE_URL;
  instance = url ? createPostgresBackend(url) : createJsonBackend();
  return instance;
}

export type { Backend } from "./types";
