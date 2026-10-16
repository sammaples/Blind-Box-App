-- Up Migration

-- Be@rbrick Barbie 400%: the chase of the Diamond box — every Be@rbrick 400%
-- and 1000% is a chase. Photo in public/products/, sharpened and cut out.
-- A listing that already answers to the same id is left alone. No units: it
-- sells once stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('400-barbie', 'Barbie', '', null, '400%', 'diamond', 'chase',
   '/products/barbie-400.webp', '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from it: an order names its piece.
delete from catalog_pieces p
 where p.id = '400-barbie'
   and not exists (select 1 from orders o where o.piece_id = p.id);
