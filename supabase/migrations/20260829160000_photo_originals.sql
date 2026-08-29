-- Store the pre-crop "original" photo per section so the crop modal can be
-- reopened with the full image at default scale (zoom = 1) instead of the
-- already-cropped/generated version.

alter table public.cafe_info
  add column if not exists banner_original text not null default '',
  add column if not exists logo_original text not null default '';

alter table public.categories
  add column if not exists photo_original text not null default '';

alter table public.advertising
  add column if not exists photo_original text not null default '';
