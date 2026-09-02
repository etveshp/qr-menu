-- Greetings (Привітання): customer greeting shown in the menu hero and the
-- admin greeting shown in the cabinet welcome popup. Each is localized
-- (uk/hu/en) and can be toggled on/off in the app.

alter table public.cafe_info
  add column if not exists greeting_customer_uk text not null default '',
  add column if not exists greeting_customer_hu text not null default '',
  add column if not exists greeting_customer_en text not null default '',
  add column if not exists greeting_customer_enabled boolean not null default false,
  add column if not exists greeting_admin_uk text not null default '',
  add column if not exists greeting_admin_hu text not null default '',
  add column if not exists greeting_admin_en text not null default '',
  add column if not exists greeting_admin_enabled boolean not null default false;
