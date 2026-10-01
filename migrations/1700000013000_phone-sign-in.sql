-- Sign-in by phone number.
--
-- A number, in E.164 form ("+15551234567"), is an account the same way an
-- email is: one account per number, found again on every sign-in. The code
-- that proves it is sent and checked by the SMS provider, so nothing about
-- it is stored here — only the number, once it has been proved.

-- Up Migration

alter table collectors add column phone text;

-- Partial, like the email and Apple indexes: most accounts have no number.
create unique index collectors_phone_idx
  on collectors (phone)
  where phone is not null;

-- Down Migration

drop index if exists collectors_phone_idx;
alter table collectors drop column if exists phone;
