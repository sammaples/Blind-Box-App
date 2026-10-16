-- A fourth figure size: the 1000%, the 28-inch figure.

-- Up Migration

alter table catalog_pieces drop constraint if exists catalog_pieces_scale;
alter table catalog_pieces add constraint catalog_pieces_scale
  check (scale in ('100%', '400%', '400%/100%', '1000%'));

-- Down Migration

-- Nothing smaller stands in for a 1000%, so those listings keep the size
-- they are closest to.
update catalog_pieces set scale = '400%' where scale = '1000%';
alter table catalog_pieces drop constraint if exists catalog_pieces_scale;
alter table catalog_pieces add constraint catalog_pieces_scale
  check (scale in ('100%', '400%', '400%/100%'));
