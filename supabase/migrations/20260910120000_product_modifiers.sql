-- Product modifiers (flavour, volume, size …) stored as JSONB on products.
-- Keeps the existing product-level RLS: public read, admin write.
alter table public.products
  add column if not exists modifiers jsonb not null default '[]'::jsonb;
