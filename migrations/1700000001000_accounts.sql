-- Accounts. A collector with a verified email is an account; the cookie-only
-- collectors that existed before this stay as they are, and are claimed by an
-- account the first time that browser signs in.

-- Up Migration

alter table collectors add column last_login_at timestamptz;

-- One account per email address, compared case-insensitively. Partial, so the
-- pre-existing collectors without an email are unaffected.
create unique index collectors_email_idx
  on collectors (lower(email)) where email is not null;

create table login_tokens (
  -- Only the hash is stored: a leaked database must not hand out live links.
  token_hash  text primary key,
  email       text        not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  consumed_at timestamptz
);

create index login_tokens_email_idx on login_tokens (lower(email));
create index login_tokens_expiry_idx on login_tokens (expires_at);

-- Down Migration

drop table if exists login_tokens;
drop index if exists collectors_email_idx;
alter table collectors drop column if exists last_login_at;
