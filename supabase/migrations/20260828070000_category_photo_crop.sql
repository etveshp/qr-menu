-- Category photo crop/positioning (4:3)
-- Adds photo_x / photo_y / photo_scale to categories so the admin
-- can crop, position and zoom the category photo (same as cafe banner).

alter table public.categories
  add column if not exists photo_x integer not null default 50,
  add column if not exists photo_y integer not null default 50,
  add column if not exists photo_scale real not null default 1;
