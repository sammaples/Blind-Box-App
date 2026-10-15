-- Up Migration

-- Series 51's photo, which arrived after its listing. Every box it has been
-- put in gets it, and a photo already uploaded by hand is left alone.
update catalog_pieces
   set image_url = '/products/series-51-blind-box.webp', updated_at = now()
 where (id = '100-series-51-blind-box' or id like '100-series-51-blind-box-in-%')
   and image_url is null;

-- Down Migration

update catalog_pieces
   set image_url = null
 where image_url = '/products/series-51-blind-box.webp';
