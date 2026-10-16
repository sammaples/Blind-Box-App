-- Up Migration

-- Be@rbrick Series 49 Blind Box: a sealed 100% box, Common, in the Bronze
-- box, like Series 50, 51 and 52. Its photo had a crease across the top,
-- retouched out. A listing that already answers to the same id is left
-- alone. No units: it sells once stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('100-series-49-blind-box', 'Series 49 Blind Box', '', null, '100%', 'bronze', 'common',
   '/products/series-49-blind-box.webp', '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from it: an order names its piece.
delete from catalog_pieces p
 where p.id = '100-series-49-blind-box'
   and not exists (select 1 from orders o where o.piece_id = p.id);
