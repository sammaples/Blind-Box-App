-- Ultra Rare: a fourth tier, between Rare and Chase.
--
-- Only the constraint changes. Nothing is reclassified, because nothing can
-- be: the three-tier migration folded the old "ultra" rows into rare and did
-- not record which ones they were. Any piece that should be Ultra Rare now
-- gets set that way in the console.
--
-- The CSV importer reads "ultra" and "ultrarare" as this tier again, so a
-- spreadsheet written for the older six-tier catalogue imports as it reads.

-- Up Migration

alter table catalog_pieces drop constraint if exists catalog_pieces_rarity;

alter table catalog_pieces add constraint catalog_pieces_rarity
  check (rarity in ('common', 'rare', 'ultra', 'chase'));

-- Down Migration

-- Ultra Rare pieces become rare again, which is where they came from. The
-- distinction is lost, exactly as it was the first time.
update catalog_pieces set rarity = 'rare' where rarity = 'ultra';

alter table catalog_pieces drop constraint if exists catalog_pieces_rarity;

alter table catalog_pieces add constraint catalog_pieces_rarity
  check (rarity in ('common', 'rare', 'chase'));
