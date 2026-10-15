-- Up Migration

-- Two Be@rbrick listings: sealed 100% blind boxes of Series 50 and 51, as
-- commons in the Bronze box. Inserted rather than typed into Inventory
-- management so they arrive with the deploy; the photos live in
-- public/products/. A listing that already answers to the same id (one made
-- by hand first) is left alone. No units: they sell once stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('100-series-50-blind-box', 'Series 50 Blind Box', '', null, '100%', 'bronze', 'common',
   '/products/series-50-blind-box.webp', '', 'bearbrick'),
  ('100-series-51-blind-box', 'Series 51 Blind Box', '', null, '100%', 'bronze', 'common',
   null, '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from them: an order names its piece.
delete from catalog_pieces p
 where p.id in ('100-series-50-blind-box', '100-series-51-blind-box')
   and not exists (select 1 from orders o where o.piece_id = p.id);
