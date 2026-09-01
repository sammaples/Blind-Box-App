import { promises as fs } from "node:fs";
import path from "node:path";
import type { Collector, Order } from "./types";

/**
 * A small JSON-file store. It is deliberately swappable: every read and write
 * in the app goes through the exported functions below, so moving to Postgres
 * later means reimplementing this file and nothing else.
 */

interface Db {
  collectors: Collector[];
  orders: Order[];
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const EMPTY: Db = { collectors: [], orders: [] };

/** Serialises writes so two concurrent purchases cannot clobber each other. */
let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function read(): Promise<Db> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<Db>;
    return {
      collectors: parsed.collectors ?? [],
      orders: parsed.orders ?? [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { ...EMPTY };
    throw err;
  }
}

async function write(db: Db): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

async function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const db = await read();
    const result = await fn(db);
    await write(db);
    return result;
  });
}

/* ---------------------------------- collectors --------------------------- */

export async function getCollector(id: string): Promise<Collector | null> {
  const db = await read();
  return db.collectors.find((c) => c.id === id) ?? null;
}

export async function upsertCollector(
  id: string,
  patch: Partial<Omit<Collector, "id" | "createdAt">> = {},
): Promise<Collector> {
  return mutate((db) => {
    let collector = db.collectors.find((c) => c.id === id);
    if (!collector) {
      collector = {
        id,
        email: null,
        displayName: null,
        createdAt: new Date().toISOString(),
        onboardedAt: null,
      };
      db.collectors.push(collector);
    }
    Object.assign(collector, patch);
    return collector;
  });
}

/* ------------------------------------ orders ----------------------------- */

export async function createOrder(order: Order): Promise<Order> {
  return mutate((db) => {
    db.orders.push(order);
    return order;
  });
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = await read();
  return db.orders.find((o) => o.id === id) ?? null;
}

export async function listOrders(collectorId: string): Promise<Order[]> {
  const db = await read();
  return db.orders
    .filter((o) => o.collectorId === collectorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<Order, "id" | "collectorId" | "pieceId">>,
): Promise<Order | null> {
  return mutate((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return null;
    Object.assign(order, patch);
    return order;
  });
}
