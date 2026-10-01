-- Deleting an account.
--
-- A deleted account is emptied, not removed: its orders still have to name
-- who bought them for the shop's own records, and a parcel already on its way
-- still needs its row. What goes is everything that identifies the person —
-- address, name, Apple id — plus their coins and any admin rights. The stamp
-- is what lets a session cookie still sitting on another device be refused:
-- sessions are signed, not stored, so there is nothing else to revoke.

-- Up Migration

alter table collectors add column deleted_at timestamptz;

-- Down Migration

alter table collectors drop column if exists deleted_at;
