-- Store the pre-crop "original" product photo so the crop modal can be
-- reopened with the full image at default scale (zoom = 1).

alter table public.products
  add column if not exists photo_original text not null default '';
