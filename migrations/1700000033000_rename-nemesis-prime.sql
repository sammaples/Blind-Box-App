-- Up Migration

-- Sam's name for it: BAPE Transformers Nemesis Prime - Black. Every box it is
-- in gets the new name; the id stays, so orders keep pointing at it.
update catalog_pieces
   set name = 'BAPE Transformers Nemesis Prime - Black', updated_at = now()
 where id = '200-bape-nemesis-prime-black' or id like '200-bape-nemesis-prime-black-in-%';

-- Down Migration

update catalog_pieces
   set name = 'Bape Nemesis Prime - Black'
 where id = '200-bape-nemesis-prime-black' or id like '200-bape-nemesis-prime-black-in-%';
