-- Up Migration

-- Be@rbrick BAPE x F1 Las Vegas, a 400%/100% set: a Diamond-box chase, as
-- every Be@rbrick 400%-and-up is. Photo in public/products/, sharpened and
-- cut out (its clear ears kept). A listing that already answers to the same
-- id is left alone. No units: it sells once stocked.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('400-100-bape-x-f1-las-vegas', 'BAPE x F1 Las Vegas', '', null, '400%/100%', 'diamond', 'chase',
   '/products/bape-f1-las-vegas-400-100.webp', '', 'bearbrick')
on conflict (id) do nothing;

-- Down Migration

-- Only while nothing has been drawn from it: an order names its piece.
delete from catalog_pieces p
 where p.id = '400-100-bape-x-f1-las-vegas'
   and not exists (select 1 from orders o where o.piece_id = p.id);
