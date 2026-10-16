-- Up Migration

-- Be@rbrick Marc Jacobs 1000%: like the 400%/100% set, the chase of the
-- Diamond box. Photo in public/products/, sharpened and cut out. A listing
-- that already answers to the same id is left alone. No units: it sells once
-- stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('1000-marc-jacobs', 'Marc Jacobs', '', null, '1000%', 'diamond', 'chase',
   '/products/marc-jacobs-1000.webp', '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from it: an order names its piece.
delete from catalog_pieces p
 where p.id = '1000-marc-jacobs'
   and not exists (select 1 from orders o where o.piece_id = p.id);
