-- Up Migration

-- Coins: a shop currency worth a dollar each.
--
-- Two things are stored, not one. `collectors.coins` is the balance, because
-- every page that mentions coins needs it and summing a ledger on each read
-- gets slower every time somebody trades something in. `coin_ledger` is the
-- history, because a bare balance column is a number nobody can check: when
-- it is wrong there is no way to find out how it got that way, and the only
-- available answer to a collector asking where their coins went is a shrug.
--
-- They are written together, in one transaction, always.

alter table collectors add column coins integer not null default 0;

create table coin_ledger (
  id          text primary key,
  collector_id text not null references collectors (id) on delete cascade,
  -- Signed: positive is a credit, negative a spend. One column rather than
  -- two, so the balance is a sum and not a pair of sums to subtract.
  delta       integer not null,
  reason      text not null,
  -- What caused it — an order id, usually. Null for a hand-made adjustment.
  ref         text,
  -- The balance this row produced. Storing it makes the history readable on
  -- its own and makes a drifted balance obvious rather than invisible.
  balance_after integer not null,
  note        text,
  created_at  timestamptz not null default now()
);

create index coin_ledger_collector_idx on coin_ledger (collector_id, created_at desc);

-- One entry per cause. This is the double-credit guard and it lives in the
-- database on purpose: two taps on Trade in, or a retried request, race each
-- other past any check written in application code, and the loser of that
-- race has to be stopped by something that cannot be raced.
create unique index coin_ledger_reason_ref_idx
  on coin_ledger (reason, ref)
  where ref is not null;

-- What a piece trades for, when it should not be what its rarity says.
-- Null means no opinion, and the ladder in src/lib/coins.ts decides.
alter table catalog_pieces add column coin_value integer;

-- What was paid, when it was paid in coins. Null means a card.
--
-- On the order rather than derived from the ledger, because a refund has to
-- know what to give back, and reading that out of a ledger entry couples
-- refunds to a row that may have been written by an older version of this.
alter table orders add column paid_coins integer;

-- Down Migration

alter table orders drop column if exists paid_coins;
alter table catalog_pieces drop column if exists coin_value;
drop index if exists coin_ledger_reason_ref_idx;
drop index if exists coin_ledger_collector_idx;
drop table if exists coin_ledger;
alter table collectors drop column if exists coins;
