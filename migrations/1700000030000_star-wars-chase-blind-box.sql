-- Up Migration

-- Be@rbrick Chase Star Wars Series 2 Blind Box: a sealed 100% box, a Rare in
-- the Bronze box, like the Chase Spider-Man box. A listing that already
-- answers to the same id is left alone. No units: it sells once stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('100-chase-star-wars-series-2-blind-box', 'Chase Star Wars Series 2 Blind Box', '', null,
   '100%', 'bronze', 'rare', '/products/chase-star-wars-series-2-blind-box.webp', '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from it: an order names its piece.
delete from catalog_pieces p
 where p.id = '100-chase-star-wars-series-2-blind-box'
   and not exists (select 1 from orders o where o.piece_id = p.id);
