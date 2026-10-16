-- Up Migration

-- Be@rbrick Bape Nemesis Prime - Black, a 200%: an Ultra Rare in the Diamond
-- box. Photo in public/products/, sharpened and cut out. A listing that
-- already answers to the same id is left alone. No units: it sells once
-- stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('200-bape-nemesis-prime-black', 'Bape Nemesis Prime - Black', '', null, '200%', 'diamond', 'ultra',
   '/products/bape-nemesis-prime-black-200.webp', '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from it: an order names its piece.
delete from catalog_pieces p
 where p.id = '200-bape-nemesis-prime-black'
   and not exists (select 1 from orders o where o.piece_id = p.id);
