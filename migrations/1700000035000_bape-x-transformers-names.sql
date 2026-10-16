-- Up Migration

-- "BAPE x Transformers …": the x the collab is written with. Every box each
-- is in gets it; ids stay, so orders keep pointing at them.
update catalog_pieces
   set name = replace(name, 'BAPE Transformers ', 'BAPE x Transformers '), updated_at = now()
 where (id like '200-bape-nemesis-prime-black%' or id like '200-bape-optimus-prime-green%')
   and name like 'BAPE Transformers %';

-- Down Migration

update catalog_pieces
   set name = replace(name, 'BAPE x Transformers ', 'BAPE Transformers ')
 where id like '200-bape-nemesis-prime-black%' or id like '200-bape-optimus-prime-green%';
