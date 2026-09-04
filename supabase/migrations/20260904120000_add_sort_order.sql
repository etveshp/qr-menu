-- Manual ordering of categories and products (drag & drop in the admin cabinet).
-- sort_order is 0-based; products are ordered within their category.

alter table public.categories
  add column if not exists sort_order integer not null default 0;

alter table public.products
  add column if not exists sort_order integer not null default 0;

-- Backfill stable, deterministic order from the current insertion order.
update public.categories c
set sort_order = sub.rn
from (
  select id, (row_number() over (order by created_at, id) - 1) as rn
  from public.categories
) sub
where c.id = sub.id;

update public.products p
set sort_order = sub.rn
from (
  select id, (row_number() over (partition by category_id order by created_at, id) - 1) as rn
  from public.products
) sub
where p.id = sub.id;
