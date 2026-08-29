-- Cafe info: add owner_name (Ім'я власника закладу)
-- Stored in the single-row cafe_info table, shown before the cafe name.

alter table public.cafe_info
  add column if not exists owner_name text not null default '';
