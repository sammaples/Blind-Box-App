-- Collections.
--
-- The shop sells more than one kind of collectible now — Bearbrick, Pop Mart,
-- Squishy — and each has its own four boxes over its own shelf. A piece
-- belongs to one collection; a draw filters on collection and tier together.
--
-- Everything already in the catalogue is Bearbrick, which is what it is.

-- Up Migration

alter table catalog_pieces add column line text not null default 'bearbrick';
create index catalog_pieces_line_tier_idx on catalog_pieces (line, tier);

-- Down Migration

drop index if exists catalog_pieces_line_tier_idx;
alter table catalog_pieces drop column if exists line;
