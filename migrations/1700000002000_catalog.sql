-- The shop's own product catalogue: the pieces you actually stock, uploaded
-- and edited from the admin console rather than generated in code.

-- Up Migration

create table catalog_pieces (
  id          text primary key,
  name        text        not null,
  set_name    text        not null default '',
  series      integer,
  scale       text        not null,
  rarity      text        not null default 'common',
  image_url   text,
  notes       text,
  -- Soft delete: a removed piece still has to resolve for the orders that
  -- already pulled it, so rows are archived rather than deleted.
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint catalog_pieces_scale check (scale in ('100%', '400%')),
  constraint catalog_pieces_rarity check (
    rarity in ('common', 'uncommon', 'rare', 'ultra', 'secret', 'grail')
  )
);

create index catalog_pieces_live_idx
  on catalog_pieces (scale) where archived_at is null;

-- Admin is a property of an account, not a separate password.
alter table collectors add column is_admin boolean not null default false;

-- Down Migration

alter table collectors drop column if exists is_admin;
drop table if exists catalog_pieces;
