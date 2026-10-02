-- Invite-only sign-in.
--
-- While the shop is being tried out by a few people, signing in is limited
-- to an invite list the owner keeps in the console: an email address or a
-- phone number per row. Admins (ADMIN_EMAILS) are always let in, whatever
-- the list says, so the owner can never lock themselves out.
--
-- Whether the list is enforced at all is a setting rather than "is the list
-- empty", so taking the last friend off it never quietly opens the doors.

-- Up Migration

create table invites (
  -- A lowercased email, or a phone number in E.164 form.
  entry      text        primary key,
  added_at   timestamptz not null default now()
);

create table app_settings (
  key   text primary key,
  value text not null
);

-- On from the start: the reason this exists is to send the app to a few
-- friends, and anything else would open sign-in to everyone on deploy.
insert into app_settings (key, value) values ('invite_only', 'true');

-- Down Migration

drop table if exists app_settings;
drop table if exists invites;
