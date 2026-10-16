-- Up Migration

-- Be@rbrick Care Bears Cheer Bear 400%: the chase of the Diamond box, like
-- the Marc Jacobs pieces. Photo in public/products/, sharpened and cut out.
-- A listing that already answers to the same id is left alone. No units: it
-- sells once stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('400-care-bears-cheer-bear', 'Care Bears Cheer Bear', '', null, '400%', 'diamond', 'chase',
   '/products/care-bears-cheer-bear-400.webp', '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from it: an order names its piece.
delete from catalog_pieces p
 where p.id = '400-care-bears-cheer-bear'
   and not exists (select 1 from orders o where o.piece_id = p.id);
