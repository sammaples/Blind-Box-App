-- Shipping moves off the order and onto a bundle.
--
-- A collector who opens six boxes over a fortnight should not pay to post six
-- parcels. Pieces now wait in the collection until they are picked, and a
-- shipment is the thing that carries an address, a tracking number and a
-- fulfilment state — for one piece or for twenty.
--
-- The address and tracking columns leave orders entirely rather than staying
-- as a second copy: two places to write a tracking number is two places for it
-- to disagree, and the wrong one always wins on the page nobody checked. Rows
-- that already carry an address become a bundle of one, so no order loses
-- where it was going.

-- Up Migration

create table shipments (
  id              text primary key,
  collector_id    text        not null,
  status          text        not null,
  address         jsonb       not null,
  tracking_number text,
  created_at      timestamptz not null,
  shipped_at      timestamptz
);

alter table shipments add constraint shipments_status
  check (status in ('packing', 'shipped', 'delivered'));

create index shipments_collector_idx on shipments (collector_id, created_at desc);

alter table orders add column shipment_id text references shipments (id);

create index orders_shipment_idx on orders (shipment_id);

-- Every order already on its way becomes its own bundle, keeping its address,
-- its tracking number and the state it had reached.
insert into shipments (id, collector_id, status, address, tracking_number, created_at)
select
  'shp_' || o.id,
  o.collector_id,
  case when o.status in ('shipped', 'delivered') then o.status else 'packing' end,
  o.shipping,
  o.tracking_number,
  o.created_at
from orders o
where o.shipping is not null;

update orders o
set shipment_id = 'shp_' || o.id
where o.shipping is not null;

alter table orders drop column shipping;
alter table orders drop column tracking_number;

-- Down Migration

alter table orders add column shipping jsonb;
alter table orders add column tracking_number text;

update orders o
set shipping = s.address,
    tracking_number = s.tracking_number
from shipments s
where o.shipment_id = s.id;

drop index if exists orders_shipment_idx;
alter table orders drop column if exists shipment_id;
drop index if exists shipments_collector_idx;
drop table if exists shipments;
