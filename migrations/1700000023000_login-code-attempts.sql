-- Up Migration

-- Email sign-in codes are six digits now, so the phone's code autofill can
-- read them. That is a million codes, not a trillion, so wrong guesses are
-- counted: five, and the address's sign-in is retired and has to be sent again.
alter table login_tokens add column failed_attempts integer not null default 0;

-- Down Migration

alter table login_tokens drop column failed_attempts;
