-- Up Migration

-- Sign in with Apple, keyed on the subject rather than the address.
--
-- Apple hands back two things about a person: a `sub`, which is a stable
-- opaque id for this app, and an email, which may be a per-app relay from
-- Hide My Email. The relay is real and deliverable, but it is not the
-- person's address and it is not stable across a revoke-and-reauthorise —
-- so matching accounts on it would eventually split one collector into two,
-- and each half would own some of the pulls.
--
-- The sub is what an account is. Email comes along for the ride because a
-- parcel needs somewhere to send a dispatch note, and because ADMIN_EMAILS
-- still grants the console by address.

alter table collectors add column apple_sub text;

-- One account per Apple id. Partial, because every collector that predates
-- this — and every one that signs in by emailed link — has no sub at all,
-- and a plain unique index would let exactly one of them exist.
create unique index collectors_apple_sub_idx
  on collectors (apple_sub)
  where apple_sub is not null;

-- Down Migration

drop index if exists collectors_apple_sub_idx;
alter table collectors drop column if exists apple_sub;
