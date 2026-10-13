-- Up Migration

-- Trade-ins: three pieces of one collection go back for a Bronze box of it.
--
-- The box that comes out is an ordinary order, drawn from the shelf like any
-- other. What marks it is the orders it was made from, kept on it so the
-- trade can be traced from either end, and so opening it can tell that it
-- was not paid for and earns no coins.
alter table orders add column made_from text[];

-- Down Migration
alter table orders drop column made_from;
