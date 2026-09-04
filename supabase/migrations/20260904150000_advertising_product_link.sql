-- Allow attaching a product to the advertising popup (like text_banner).
-- Clicking the popup in the menu then opens the linked product.

alter table public.advertising
  add column if not exists category_id text,
  add column if not exists product_id text;
