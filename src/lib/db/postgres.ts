import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import type { AuditBatch, AuditEntry, Collector, Order, Scale } from "../types";
import type {
  Backend,
  BuildOrder,
  Draw,
  Reservation,
  StockChange,
  StockChangeResult,
  StockRow,
} from "./types";

/**
 * The Postgres backend. Unlike the JSON file, this one is safe across
 * processes: correctness comes from row locks and constraints in the database
 * rather than an in-process mutex, so any number of app instances can serve
 * the same shop.
 */

const SCHEMA = `
create table if not exists collectors (
  id            text primary key,
  email         text,
  display_name  text,
  created_at    timestamptz not null default now(),
  onboarded_at  timestamptz
);

create table if not exists stock (
  piece_id  text primary key,
  scale     text    not null,
  stocked   integer not null default 0,
  sold      integer not null default 0,
  -- The database itself refuses to oversell, whatever the app believes.
  constraint stock_not_oversold check (sold <= stocked),
  constraint stock_non_negative check (stocked >= 0 and sold >= 0)
);
create index if not exists stock_shelf_idx on stock (scale) where stocked > sold;

create table if not exists orders (
  id              text primary key,
  collector_id    text        not null,
  product_id      text        not null,
  piece_id        text        not null,
  status          text        not null,
  created_at      timestamptz not null,
  revealed_at     timestamptz,
  roll_seed       text        not null,
  roll_value      double precision not null,
  pool_snapshot   jsonb       not null,
  email           text,
  shipping        jsonb,
  tracking_number text
);
create index if not exists orders_collector_idx
  on orders (collector_id, created_at desc);

create table if not exists audit (
  id           uuid primary key,
  batch_id     uuid        not null,
  at           timestamptz not null,
  piece_id     text        not null,
  op           text        not null,
  before_units integer     not null,
  after_units  integer     not null,
  sold         integer     not null
);
create index if not exists audit_at_idx on audit (at desc, id);
`;

const AUDIT_LIMIT = 1000;

/* ------------------------------ row mapping ----------------------------- */

type Row = Record<string, unknown>;

function toCollector(r: Row): Collector {
  return {
    id: r.id as string,
    email: (r.email as string | null) ?? null,
    displayName: (r.display_name as string | null) ?? null,
    createdAt: (r.created_at as Date).toISOString(),
    onboardedAt: r.onboarded_at ? (r.onboarded_at as Date).toISOString() : null,
  };
}

function toOrder(r: Row): Order {
  return {
    id: r.id as string,
    collectorId: r.collector_id as string,
    productId: r.product_id as string,
    pieceId: r.piece_id as string,
    status: r.status as Order["status"],
    createdAt: (r.created_at as Date).toISOString(),
    revealedAt: r.revealed_at ? (r.revealed_at as Date).toISOString() : null,
    rollSeed: r.roll_seed as string,
    rollValue: Number(r.roll_value),
    poolSnapshot: r.pool_snapshot as Order["poolSnapshot"],
    email: (r.email as string | null) ?? null,
    shipping: (r.shipping as Order["shipping"]) ?? null,
    trackingNumber: (r.tracking_number as string | null) ?? null,
  };
}

function toBatch(r: Row): AuditBatch {
  const pieceCount = Number(r.piece_count);
  return {
    batchId: r.batch_id as string,
    at: (r.at as Date).toISOString(),
    op: r.op as AuditEntry["op"],
    pieceCount,
    delta: Number(r.delta),
    pieceIds: r.piece_ids as string[],
    single:
      pieceCount === 1
        ? {
            before: Number(r.before_units),
            after: Number(r.after_units),
            sold: Number(r.sold),
          }
        : null,
  };
}

/* -------------------------------- backend ------------------------------- */

export function createPostgresBackend(connectionString: string): Backend {
  const pool = new Pool({ connectionString, max: 10 });
  let ready: Promise<void> | null = null;

  /** Applies the schema once per process, then gets out of the way. */
  function migrated(): Promise<void> {
    ready ??= pool.query(SCHEMA).then(() => undefined);
    return ready;
  }

  async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    await migrated();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const result = await fn(client);
      await client.query("commit");
      return result;
    } catch (err) {
      await client.query("rollback").catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  async function query(text: string, values?: unknown[]) {
    await migrated();
    return pool.query(text, values);
  }

  return {
    name: "postgres",

    async seed(units) {
      await withTx(async (client) => {
        // Lock the table so two instances starting at once seed it once.
        await client.query("lock table stock in exclusive mode");
        const { rows } = await client.query("select count(*)::int as n from stock");
        if (rows[0].n > 0) return;

        for (const [pieceId, { scale, units: count }] of units) {
          await client.query(
            "insert into stock (piece_id, scale, stocked, sold) values ($1, $2, $3, 0)",
            [pieceId, scale, count],
          );
        }
      });
    },

    async upsertCollector(id, patch) {
      const { rows } = await query(
        `insert into collectors (id, email, display_name, onboarded_at)
         values ($1, $2, $3, $4)
         on conflict (id) do update set
           email        = coalesce(excluded.email, collectors.email),
           display_name = coalesce(excluded.display_name, collectors.display_name),
           onboarded_at = coalesce(excluded.onboarded_at, collectors.onboarded_at)
         returning *`,
        [
          id,
          patch.email ?? null,
          patch.displayName ?? null,
          patch.onboardedAt ?? null,
        ],
      );
      return toCollector(rows[0]);
    },

    async getOrder(id) {
      const { rows } = await query("select * from orders where id = $1", [id]);
      return rows[0] ? toOrder(rows[0]) : null;
    },

    async listOrders(collectorId) {
      const { rows } = await query(
        "select * from orders where collector_id = $1 order by created_at desc",
        [collectorId],
      );
      return rows.map(toOrder);
    },

    async updateOrder(id, patch) {
      const sets: string[] = [];
      const values: unknown[] = [id];
      const set = (column: string, value: unknown) => {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      };

      if (patch.status !== undefined) set("status", patch.status);
      if (patch.revealedAt !== undefined) set("revealed_at", patch.revealedAt);
      if (patch.shipping !== undefined) set("shipping", JSON.stringify(patch.shipping));
      if (patch.trackingNumber !== undefined) set("tracking_number", patch.trackingNumber);
      if (patch.email !== undefined) set("email", patch.email);
      if (sets.length === 0) return this.getOrder(id);

      const { rows } = await query(
        `update orders set ${sets.join(", ")} where id = $1 returning *`,
        values,
      );
      return rows[0] ? toOrder(rows[0]) : null;
    },

    async stockRows(): Promise<StockRow[]> {
      const { rows } = await query("select * from stock");
      return rows.map((r) => ({
        pieceId: r.piece_id as string,
        scale: r.scale as Scale,
        stocked: r.stocked as number,
        sold: r.sold as number,
      }));
    },

    async reserve(scale, draw: Draw, build: BuildOrder): Promise<Reservation | null> {
      return withTx(async (client) => {
        // The draw depends on the whole shelf, so the whole shelf is locked for
        // the length of the transaction. Buyers of one shelf serialise; buyers
        // of different shelves do not block each other.
        const { rows } = await client.query(
          `select piece_id, stocked - sold as available
             from stock
            where scale = $1 and stocked > sold
            order by piece_id
              for update`,
          [scale],
        );
        if (rows.length === 0) return null;

        const snapshot = rows.map(
          (r) => [r.piece_id as string, Number(r.available)] as const,
        );
        const { pieceId, seed, rollValue } = draw(snapshot);

        const taken = await client.query(
          "update stock set sold = sold + 1 where piece_id = $1 and stocked > sold",
          [pieceId],
        );
        if (taken.rowCount === 0) return null;

        const order = build({ pieceId, seed, rollValue, poolSnapshot: snapshot });
        await client.query(
          `insert into orders (
             id, collector_id, product_id, piece_id, status, created_at,
             revealed_at, roll_seed, roll_value, pool_snapshot, email,
             shipping, tracking_number
           ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            order.id,
            order.collectorId,
            order.productId,
            order.pieceId,
            order.status,
            order.createdAt,
            order.revealedAt,
            order.rollSeed,
            order.rollValue,
            JSON.stringify(order.poolSnapshot),
            order.email,
            order.shipping ? JSON.stringify(order.shipping) : null,
            order.trackingNumber,
          ],
        );

        return { pieceId, seed, rollValue, poolSnapshot: snapshot, order };
      });
    },

    async applyStockChanges(changes: readonly StockChange[]): Promise<StockChangeResult[]> {
      return withTx(async (client) => {
        const results: StockChangeResult[] = [];
        const entries: AuditEntry[] = [];
        const batchId = randomUUID();
        const at = new Date().toISOString();

        for (const change of changes) {
          const existing = await client.query(
            "select stocked, sold from stock where piece_id = $1 for update",
            [change.pieceId],
          );
          const current = existing.rows[0]?.stocked ?? 0;
          const sold = existing.rows[0]?.sold ?? 0;
          const units = Number.isFinite(change.units) ? Math.floor(change.units!) : 0;

          let next: number;
          if (change.op === "add") next = current + Math.max(0, units);
          else if (change.op === "set") next = Math.max(0, units);
          else next = sold;
          next = Math.max(next, sold);

          if (next === 0 && sold === 0) {
            await client.query("delete from stock where piece_id = $1", [change.pieceId]);
          } else {
            await client.query(
              `insert into stock (piece_id, scale, stocked, sold)
               values ($1, $2, $3, 0)
               on conflict (piece_id) do update set stocked = excluded.stocked`,
              [change.pieceId, change.scale, next],
            );
          }

          results.push({ pieceId: change.pieceId, stocked: next, sold, available: next - sold });

          if (next !== current) {
            entries.push({
              id: randomUUID(),
              batchId,
              at,
              pieceId: change.pieceId,
              op: change.op,
              before: current,
              after: next,
              sold,
            });
          }
        }

        for (const entry of entries) {
          await client.query(
            `insert into audit (id, batch_id, at, piece_id, op, before_units, after_units, sold)
             values ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              entry.id,
              entry.batchId,
              entry.at,
              entry.pieceId,
              entry.op,
              entry.before,
              entry.after,
              entry.sold,
            ],
          );
        }

        // Trim in the same transaction, so the log never grows without bound.
        await client.query(
          `delete from audit where id not in (
             select id from audit order by at desc, id desc limit $1
           )`,
          [AUDIT_LIMIT],
        );

        return results;
      });
    },

    async recentAudit(limit) {
      // Summarised in SQL so a batch's size is always its true size, not the
      // size of whatever slice happened to be fetched.
      const { rows } = await query(
        `select batch_id,
                max(at)                                  as at,
                min(op)                                  as op,
                count(*)::int                            as piece_count,
                sum(after_units - before_units)::int     as delta,
                (array_agg(piece_id order by piece_id))[1:4] as piece_ids,
                min(before_units)                        as before_units,
                min(after_units)                         as after_units,
                min(sold)                                as sold
           from audit
          group by batch_id
          order by max(at) desc, batch_id
          limit $1`,
        [limit],
      );
      return rows.map(toBatch);
    },
  };
}
