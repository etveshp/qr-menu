-- Recommended products ("Ідеально смакує разом")
-- Adds recommended_ids (array of product ids) so the admin can pick which
-- products appear in the expanded product card in the menu.

alter table public.products
  add column if not exists recommended_ids text[] not null default '{}';
