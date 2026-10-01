-- A third figure size: the 400% and its matching 100%, sold as one piece.

-- Up Migration

alter table catalog_pieces drop constraint if exists catalog_pieces_scale;
alter table catalog_pieces add constraint catalog_pieces_scale
  check (scale in ('100%', '400%', '400%/100%'));

-- Down Migration

-- A combo cannot stay a combo, so it goes back as the 400% it is built around.
update catalog_pieces set scale = '400%' where scale = '400%/100%';
alter table catalog_pieces drop constraint if exists catalog_pieces_scale;
alter table catalog_pieces add constraint catalog_pieces_scale
  check (scale in ('100%', '400%'));
