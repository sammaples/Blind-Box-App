-- What kind of figure a piece is, independent of which series it came in:
-- Flag, Cute, Jellybean, Horror, Animal, Pattern, Sci-Fi, Hero, Artist, Game,
-- Secret. It is the second half of the line under a piece's name.
--
-- Constrained rather than free text, because "Sci-Fi", "sci fi" and "SciFi"
-- would read as three different categories on three cards.
--
-- Nullable: the console requires a category on a numbered series piece, where
-- the lineup slot is part of what the series is, and leaves it optional on a
-- one-off. Every row that exists now predates the field, so null is also what
-- "not asked" looks like.

-- Up Migration

alter table catalog_pieces add column category text;

alter table catalog_pieces add constraint catalog_pieces_category
  check (
    category is null
    or category in (
      'flag', 'cute', 'jellybean', 'horror', 'animal',
      'pattern', 'scifi', 'hero', 'artist', 'game', 'secret'
    )
  );

-- Down Migration

alter table catalog_pieces drop constraint if exists catalog_pieces_category;
alter table catalog_pieces drop column if exists category;
