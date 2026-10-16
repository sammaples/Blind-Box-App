-- A fifth figure size: the 200%, between the 100% and the 400%.

-- Up Migration

alter table catalog_pieces drop constraint if exists catalog_pieces_scale;
alter table catalog_pieces add constraint catalog_pieces_scale
  check (scale in ('100%', '200%', '400%', '400%/100%', '1000%'));

-- Down Migration

-- A 200% goes back as the size it is nearest in kind: the 100%.
update catalog_pieces set scale = '100%' where scale = '200%';
alter table catalog_pieces drop constraint if exists catalog_pieces_scale;
alter table catalog_pieces add constraint catalog_pieces_scale
  check (scale in ('100%', '400%', '400%/100%', '1000%'));
