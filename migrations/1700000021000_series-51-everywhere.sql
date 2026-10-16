-- Up Migration

-- Series 51 Blind Box, brought level with Series 50: listed in Bronze again if
-- it had been deleted or archived, and in every other box Series 50 is in,
-- each with its photo. Units are left to Inventory management.
insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
values
  ('100-series-51-blind-box', 'Series 51 Blind Box', '', null, '100%', 'bronze', 'common',
   '/products/series-51-blind-box.webp', '', 'bearbrick')
on conflict (id) do update
  set archived_at = null,
      image_url = coalesce(catalog_pieces.image_url, excluded.image_url),
      updated_at = now();

insert into catalog_pieces (id, name, set_name, series, scale, tier, rarity, image_url, notes, line)
select '100-series-51-blind-box-in-' || p.tier, 'Series 51 Blind Box', '', null, '100%', p.tier,
       'common', '/products/series-51-blind-box.webp', '', 'bearbrick'
  from catalog_pieces p
 where p.id like '100-series-50-blind-box-in-%'
   and p.archived_at is null
   and not exists (
     select 1 from catalog_pieces q
      where q.tier = p.tier and q.archived_at is null
        and (q.id = '100-series-51-blind-box' or q.id like '100-series-51-blind-box-in-%'))
on conflict (id) do update
  set archived_at = null,
      image_url = coalesce(catalog_pieces.image_url, excluded.image_url),
      updated_at = now();

update catalog_pieces
   set image_url = '/products/series-51-blind-box.webp', updated_at = now()
 where (id = '100-series-51-blind-box' or id like '100-series-51-blind-box-in-%')
   and image_url is null;

-- Down Migration

-- Nothing to undo safely: the listings may have sold by then.
select 1;
