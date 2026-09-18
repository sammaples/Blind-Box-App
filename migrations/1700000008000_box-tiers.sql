-- Up Migration

-- Boxes are sold by tier now, not by size.
--
-- `scale` stays exactly where it is and keeps meaning what it meant: how big
-- the figure physically is. It is still needed — a 400% is a different thing to
-- make, box and post, and the drop-shipper handling the large format works off
-- it. What it stops doing is deciding which box a piece can come out of. That
-- is `tier`, and it is the column a draw filters on.

alter table catalog_pieces add column tier text;

-- Existing rows predate tiers, so they are graded by the only signal they
-- carry: a piece's rarity is roughly how good a box it belongs in. It is a
-- starting point for the console to correct, not a guess at anyone's intent —
-- and it is deterministic, so re-running it lands in the same place.
update catalog_pieces set tier = case rarity
  when 'common' then 'bronze'
  when 'rare'   then 'silver'
  when 'ultra'  then 'gold'
  when 'chase'  then 'diamond'
  else 'bronze'
end;

alter table catalog_pieces alter column tier set not null;
alter table catalog_pieces alter column tier set default 'bronze';
alter table catalog_pieces
  add constraint catalog_pieces_tier
  check (tier in ('bronze', 'silver', 'gold', 'diamond'));

-- The shelf index answers "what can this box still draw?", so it follows the
-- draw onto tier. Dropped and rebuilt rather than renamed: it is a partial
-- index on the old column, and the column is about to mean something else.
drop index if exists catalog_pieces_live_idx;
create index catalog_pieces_live_idx
  on catalog_pieces (tier) where archived_at is null;

-- Stock rows carry the tier so a draw never has to join to the catalogue.
alter table stock rename column scale to tier;
alter table stock alter column tier drop default;
update stock s set tier = c.tier from catalog_pieces c where c.id = s.piece_id;
-- A stock row for a piece the catalogue has since forgotten keeps its unit
-- count and lands in bronze, where an admin will see it rather than lose it.
update stock set tier = 'bronze'
  where tier is null or tier not in ('bronze', 'silver', 'gold', 'diamond');
alter table stock
  add constraint stock_tier check (tier in ('bronze', 'silver', 'gold', 'diamond'));

drop index if exists stock_shelf_idx;
create index stock_shelf_idx on stock (tier) where stocked > sold;

-- Down Migration

drop index if exists stock_shelf_idx;
alter table stock drop constraint if exists stock_tier;
alter table stock rename column tier to scale;
update stock s set scale = c.scale from catalog_pieces c where c.id = s.piece_id;
update stock set scale = '100%' where scale not in ('100%', '400%');
create index stock_shelf_idx on stock (scale) where stocked > sold;

drop index if exists catalog_pieces_live_idx;
create index catalog_pieces_live_idx
  on catalog_pieces (scale) where archived_at is null;
alter table catalog_pieces drop constraint if exists catalog_pieces_tier;
alter table catalog_pieces drop column tier;
