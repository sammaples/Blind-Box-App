-- The schema as it stood when migrations were introduced. Everything here was
-- previously applied at runtime with "create table if not exists"; this is the
-- same shape, recorded as a migration so later changes have somewhere to go.

-- Up Migration

create table collectors (
  id            text primary key,
  email         text,
  display_name  text,
  created_at    timestamptz not null default now(),
  onboarded_at  timestamptz
);

create table stock (
  piece_id  text primary key,
  scale     text    not null,
  stocked   integer not null default 0,
  sold      integer not null default 0,
  -- The database itself refuses to oversell, whatever the app believes.
  constraint stock_not_oversold check (sold <= stocked),
  constraint stock_non_negative check (stocked >= 0 and sold >= 0)
);

-- Partial: the shelf query only ever asks for pieces that still have units.
create index stock_shelf_idx on stock (scale) where stocked > sold;

create table orders (
  id              text primary key,
  collector_id    text        not null,
  product_id      text        not null,
  piece_id        text        not null,
  status          text        not null,
  created_at      timestamptz not null,
  revealed_at     timestamptz,
  roll_seed       text        not null,
  roll_value      double precision not null,
  -- The shelf an order was drawn from, so its roll stays replayable.
  pool_snapshot   jsonb       not null,
  email           text,
  shipping        jsonb,
  tracking_number text
);

create index orders_collector_idx on orders (collector_id, created_at desc);

create table audit (
  id           uuid primary key,
  batch_id     uuid        not null,
  at           timestamptz not null,
  piece_id     text        not null,
  op           text        not null,
  before_units integer     not null,
  after_units  integer     not null,
  sold         integer     not null
);

create index audit_at_idx on audit (at desc, id);

-- Down Migration

drop table if exists audit;
drop table if exists orders;
drop table if exists stock;
drop table if exists collectors;
