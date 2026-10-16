-- Up Migration

-- Be@rbrick Marc Jacobs, a 400%/100% set: the chase of the Diamond box, as a
-- 400% is the chase of whichever box it is in. Photo in public/products/, cut
-- out and sharpened. A listing that already answers to the same id is left
-- alone. No units: it sells once stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('400-100-marc-jacobs', 'Marc Jacobs', '', null, '400%/100%', 'diamond', 'chase',
   '/products/marc-jacobs-400-100.webp', '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from it: an order names its piece.
delete from catalog_pieces p
 where p.id = '400-100-marc-jacobs'
   and not exists (select 1 from orders o where o.piece_id = p.id);
