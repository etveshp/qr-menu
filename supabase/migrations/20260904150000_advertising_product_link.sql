-- Allow attaching a product to the photo banner in the menu (like text_banner).
-- Clicking the photo banner then opens the linked product.

alter table public.advertising
  add column if not exists category_id text,
  add column if not exists product_id text;
