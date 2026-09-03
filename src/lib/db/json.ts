import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AuditBatch,
  AuditEntry,
  Collector,
  Order,
  Piece,
  Scale,
} from "../types";
import { LEGACY_RARITY } from "../catalog";
import { contentTypeFor, isImageId } from "../images";
import type {
  Backend,
  BuildOrder,
  Draw,
  Reservation,
  StockChange,
  StockChangeResult,
  StockRow,
  StoredImage,
} from "./types";

/**
 * A JSON-file backend. Zero setup, which is what makes the demo runnable with
 * no database — and single-process, which is what makes it unsuitable for real
 * traffic. Writes are serialised through one in-process lock; two Node
 * processes pointed at the same file would corrupt each other.
 */

interface LoginToken {
  tokenHash: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
}

interface Db {
  collectors: Collector[];
  pieces: Piece[];
  loginTokens: LoginToken[];
  orders: Order[];
  stock: Record<string, { scale: Scale; stocked: number; sold: number }>;
  audit: AuditEntry[];
}

const EMPTY: Db = {
  collectors: [],
  pieces: [],
  loginTokens: [],
  orders: [],
  stock: {},
  audit: [],
};
const AUDIT_LIMIT = 1000;

function blankCollector(id: string): Collector {
  return {
    id,
    email: null,
    displayName: null,
    createdAt: new Date().toISOString(),
    onboardedAt: null,
    lastLoginAt: null,
    isAdmin: false,
  };
}

export function createJsonBackend(): Backend {
  // Statically scoped on purpose: a computed path makes the bundler trace the
  // whole project into the server output.
  const DB_PATH = path.join(process.cwd(), "data", "db.json");
  // Photos live beside the database as ordinary files, not base64 inside it.
  // db.json is rewritten in full on every order; a few megabytes of image data
  // riding along with each of those writes would be the slowest thing here.
  const IMAGE_DIR = path.join(process.cwd(), "data", "images");

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
        pieces: parsed.pieces ?? [],
        loginTokens: parsed.loginTokens ?? [],
        orders: parsed.orders ?? [],
        stock: parsed.stock ?? {},
        audit: parsed.audit ?? [],
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

  function transact<T>(fn: (db: Db) => T): Promise<T> {
    return withLock(async () => {
      const db = await read();
      const result = fn(db);
      await write(db);
      return result;
    });
  }

  return {
    name: "json",

    async seed(units) {
      await transact((db) => {
        // Only an untouched warehouse gets seeded — never a running one.
        if (Object.keys(db.stock).length > 0) return;
        for (const [pieceId, { scale, units: count }] of units) {
          db.stock[pieceId] = { scale, stocked: count, sold: 0 };
        }
      });
    },

    async upsertCollector(id, patch) {
      return transact((db) => {
        let collector = db.collectors.find((c) => c.id === id);
        if (!collector) {
          collector = blankCollector(id);
          db.collectors.push(collector);
        }
        Object.assign(collector, patch);
        return collector;
      });
    },

    async accountForEmail(email) {
      const key = email.trim().toLowerCase();
      return transact((db) => {
        let account = db.collectors.find(
          (c) => (c.email ?? "").toLowerCase() === key,
        );
        if (!account) {
          account = blankCollector(`acc_${randomUUID().replace(/-/g, "").slice(0, 24)}`);
          account.email = key;
          db.collectors.push(account);
        }
        account.lastLoginAt = new Date().toISOString();
        return account;
      });
    },

    async createLoginToken({ tokenHash, email, expiresAt }) {
      const key = email.trim().toLowerCase();
      await transact((db) => {
        // One live token per address: requesting a new link retires the old.
        db.loginTokens = (db.loginTokens ?? []).filter(
          (t) => t.email !== key || t.consumedAt !== null,
        );
        db.loginTokens.push({
          tokenHash,
          email: key,
          createdAt: new Date().toISOString(),
          expiresAt,
          consumedAt: null,
        });
      });
    },

    async consumeLoginToken(tokenHash, now) {
      return transact((db) => {
        const tokens = db.loginTokens ?? [];
        const token = tokens.find((t) => t.tokenHash === tokenHash);
        if (!token || token.consumedAt !== null || token.expiresAt <= now) {
          return null;
        }
        token.consumedAt = now;
        return token.email;
      });
    },

    async claimOrders(fromCollectorId, toCollectorId) {
      if (fromCollectorId === toCollectorId) return 0;
      return transact((db) => {
        let moved = 0;
        for (const order of db.orders) {
          if (order.collectorId === fromCollectorId) {
            order.collectorId = toCollectorId;
            moved += 1;
          }
        }
        return moved;
      });
    },

    async getOrder(id) {
      const db = await read();
      return db.orders.find((o) => o.id === id) ?? null;
    },

    async listOrders(collectorId) {
      const db = await read();
      return db.orders
        .filter((o) => o.collectorId === collectorId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async updateOrder(id, patch) {
      return transact((db) => {
        const order = db.orders.find((o) => o.id === id);
        if (!order) return null;
        Object.assign(order, patch);
        return order;
      });
    },

    async listPieces() {
      const db = await read();
      // A file written before the tiers collapsed still says "uncommon". The
      // Postgres side gets a migration; a JSON file has nobody to run one, so
      // it is mapped on the way out.
      return db.pieces.map((piece) => ({
        ...piece,
        rarity: LEGACY_RARITY[piece.rarity] ?? "common",
      }));
    },

    async savePieces(pieces) {
      await transact((db) => {
        for (const piece of pieces) {
          const index = db.pieces.findIndex((p) => p.id === piece.id);
          if (index >= 0) db.pieces[index] = { ...db.pieces[index], ...piece };
          else db.pieces.push(piece);
        }
      });
    },

    async setPieceArchived(pieceId, archived) {
      return transact((db) => {
        const piece = db.pieces.find((p) => p.id === pieceId);
        if (!piece) return null;
        piece.archived = archived;
        return piece;
      });
    },

    async putImage({ id, bytes }: StoredImage) {
      // An id becomes a path here, so an unvetted one is a way to write
      // anywhere on disk. Ids are issued by this app and checked on the way in
      // and the way out.
      if (!isImageId(id)) throw new Error("Not an image id this app issued");
      await fs.mkdir(IMAGE_DIR, { recursive: true });
      await fs.writeFile(path.join(IMAGE_DIR, id), bytes);
    },

    async getImage(id) {
      const contentType = isImageId(id) ? contentTypeFor(id) : null;
      if (!contentType) return null;
      try {
        const bytes = await fs.readFile(path.join(IMAGE_DIR, id));
        return { id, contentType, bytes };
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw err;
      }
    },

    async setAdmin(accountId, isAdmin) {
      await transact((db) => {
        const account = db.collectors.find((c) => c.id === accountId);
        if (account) account.isAdmin = isAdmin;
      });
    },

    async stockRows(): Promise<StockRow[]> {
      const db = await read();
      return Object.entries(db.stock).map(([pieceId, row]) => ({
        pieceId,
        scale: row.scale,
        stocked: row.stocked,
        sold: row.sold,
      }));
    },

    async reserve(scale, draw: Draw, build: BuildOrder): Promise<Reservation | null> {
      return transact((db) => {
        const archived = new Set(
          db.pieces.filter((p) => p.archived).map((p) => p.id),
        );
        const available = Object.entries(db.stock)
          .filter(
            ([pieceId, row]) =>
              row.scale === scale && row.stocked > row.sold && !archived.has(pieceId),
          )
          .map(([pieceId, row]) => [pieceId, row.stocked - row.sold] as const)
          .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

        if (available.length === 0) return null;

        const { pieceId, seed, rollValue } = draw(available);
        const row = db.stock[pieceId];
        if (!row || row.stocked <= row.sold || archived.has(pieceId)) return null;

        row.sold += 1;
        const order = build({ pieceId, seed, rollValue, poolSnapshot: available });
        db.orders.push(order);
        return { pieceId, seed, rollValue, poolSnapshot: available, order };
      });
    },

    async applyStockChanges(changes: readonly StockChange[]): Promise<StockChangeResult[]> {
      return transact((db) => {
        const results: StockChangeResult[] = [];
        const entries: AuditEntry[] = [];
        const batchId = randomUUID();
        const at = new Date().toISOString();

        for (const change of changes) {
          const row = db.stock[change.pieceId] ?? {
            scale: change.scale,
            stocked: 0,
            sold: 0,
          };
          const current = row.stocked;
          const units = Number.isFinite(change.units) ? Math.floor(change.units!) : 0;

          let next: number;
          if (change.op === "add") next = current + Math.max(0, units);
          else if (change.op === "set") next = Math.max(0, units);
          else next = row.sold;
          next = Math.max(next, row.sold);

          if (next === 0 && row.sold === 0) delete db.stock[change.pieceId];
          else db.stock[change.pieceId] = { ...row, stocked: next };

          results.push({
            pieceId: change.pieceId,
            stocked: next,
            sold: row.sold,
            available: next - row.sold,
          });

          if (next !== current) {
            entries.push({
              id: randomUUID(),
              batchId,
              at,
              pieceId: change.pieceId,
              op: change.op,
              before: current,
              after: next,
              sold: row.sold,
            });
          }
        }

        db.audit = [...entries.reverse(), ...db.audit].slice(0, AUDIT_LIMIT);
        return results;
      });
    },

    async recentAudit(limit) {
      const db = await read();
      const batches = new Map<string, AuditBatch>();

      // db.audit is newest-first, so batches come out in the right order.
      for (const entry of db.audit) {
        let batch = batches.get(entry.batchId);
        if (!batch) {
          if (batches.size >= limit) continue;
          batch = {
            batchId: entry.batchId,
            at: entry.at,
            op: entry.op,
            pieceCount: 0,
            delta: 0,
            pieceIds: [],
            single: null,
          };
          batches.set(entry.batchId, batch);
        }
        batch.pieceCount += 1;
        batch.delta += entry.after - entry.before;
        // Sorted, so both backends name a batch from the same sample.
        batch.pieceIds = [...batch.pieceIds, entry.pieceId].sort().slice(0, 4);
        batch.single =
          batch.pieceCount === 1
            ? { before: entry.before, after: entry.after, sold: entry.sold }
            : null;
      }

      return [...batches.values()];
    },
  };
}
