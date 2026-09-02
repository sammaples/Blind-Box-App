-- Uploaded product photos.
--
-- The bytes live in the database rather than on an image host, so a catalogue
-- cannot go blank because someone else's service changed its terms. Photos are
-- small and read far more often than written, which is exactly what a page
-- cache in front of this is good at.

-- Up Migration

create table product_images (
  id           text        primary key,
  content_type text        not null,
  bytes        bytea       not null,
  created_at   timestamptz not null default now()
);

-- Down Migration

drop table if exists product_images;
