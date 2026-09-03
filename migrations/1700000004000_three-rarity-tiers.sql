-- Six rarity tiers collapse to three: chase, rare, common.
--
-- Common / Uncommon / Rare / Ultra Rare / Secret / Grail asked a buyer to hold
-- a six-step ranking in their head before a badge meant anything. The odds were
-- never in the tier anyway — a pull rate is a piece's share of the units left,
-- so a tier is a label on a card and nothing more.
--
-- The rows have to move before the constraint does, or the new check would
-- reject the very data it is being added for.

-- Up Migration

alter table catalog_pieces drop constraint if exists catalog_pieces_rarity;

update catalog_pieces set rarity = case rarity
  when 'grail'    then 'chase'
  when 'secret'   then 'chase'
  when 'ultra'    then 'rare'
  when 'uncommon' then 'common'
  else rarity
end;

alter table catalog_pieces add constraint catalog_pieces_rarity
  check (rarity in ('common', 'rare', 'chase'));

-- Down Migration

-- Going back cannot restore what the collapse merged: an 'uncommon' and a
-- 'common' are both 'common' now, and nothing records which was which. This
-- only widens the constraint again and renames 'chase' to a value the old
-- check accepts, so the schema is valid rather than the data restored.
alter table catalog_pieces drop constraint if exists catalog_pieces_rarity;

update catalog_pieces set rarity = 'secret' where rarity = 'chase';

alter table catalog_pieces add constraint catalog_pieces_rarity
  check (rarity in ('common', 'uncommon', 'rare', 'ultra', 'secret', 'grail'));
