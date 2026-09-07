-- Single badge per dish (radio selection in the admin cabinet), shown on the
-- product card in the menu. Empty string = no badge.
alter table public.products
  add column if not exists badge text not null default '';
