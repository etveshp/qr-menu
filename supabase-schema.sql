-- Supabase schema for Svit Kavy (Світ Кави) QR Menu
-- Run this in Supabase SQL Editor after creating the project.

-- ============================================================
-- 1. Tables
-- ============================================================

-- Cafe info (single row)
create table public.cafe_info (
  id integer primary key default 1,
  owner_name_uk text not null default '',
  owner_name_hu text not null default '',
  owner_name_en text not null default '',
  name_uk text not null default '',
  name_hu text not null default '',
  name_en text not null default '',
  description_uk text not null default '',
  description_hu text not null default '',
  description_en text not null default '',
  banner text not null default '',
  logo text not null default '',
  instagram text not null default '',
  banner_x integer not null default 50,
  banner_y integer not null default 50,
  banner_scale real not null default 1,
  logo_x integer not null default 50,
  logo_y integer not null default 50,
  logo_scale real not null default 1,
  banner_original text not null default '',
  logo_original text not null default '',
  greeting_customer_uk text not null default '',
  greeting_customer_hu text not null default '',
  greeting_customer_en text not null default '',
  greeting_customer_enabled boolean not null default false,
  greeting_admin_uk text not null default '',
  greeting_admin_hu text not null default '',
  greeting_admin_en text not null default '',
  greeting_admin_enabled boolean not null default false,
  show_table_number boolean not null default false,
  default_lang text not null default 'uk',
  updated_at timestamptz not null default now()
);

-- Categories
create table public.categories (
  id text primary key,
  name_uk text not null,
  name_hu text not null default '',
  name_en text not null default '',
  photo text not null default '',
  photo_x integer not null default 50,
  photo_y integer not null default 50,
  photo_scale real not null default 1,
  photo_original text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Products
create table public.products (
  id text primary key,
  category_id text not null references public.categories(id) on delete cascade,
  name_uk text not null,
  name_hu text not null default '',
  name_en text not null default '',
  description_uk text not null default '',
  description_hu text not null default '',
  description_en text not null default '',
  ingredients_uk text not null default '',
  ingredients_hu text not null default '',
  ingredients_en text not null default '',
  price numeric not null default 0,
  photo text not null default '',
  photo_original text not null default '',
  recommended_ids text[] not null default '{}',
  badge text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Profiles (admin roles live here, NOT in JWT)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Photo banner in the menu (single row)
create table public.advertising (
  id integer primary key default 1,
  photo text not null default '',
  photo_original text not null default '',
  delay_seconds integer not null default 5 check (delay_seconds >= 0),
  enabled boolean not null default false,
  show_until date,
  category_id text,
  product_id text,
  updated_at timestamptz not null default now()
);

-- Text banner (single row): sticky bar under the menu header
create table public.text_banner (
  id integer primary key default 1,
  text text not null default '',
  category_id text,
  product_id text,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. Row Level Security
-- ============================================================

-- Helper: is the current user an admin?
-- SECURITY DEFINER required: the function reads profiles while RLS
-- policies on profiles also use it — otherwise infinite recursion (54001).
create or replace function public.is_admin_true()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
$$;

revoke execute on function public.is_admin_true() from anon, public;
grant execute on function public.is_admin_true() to authenticated;

-- cafe_info: public read, admin write (via profiles)
alter table public.cafe_info enable row level security;
create policy "cafe_info read: public" on public.cafe_info for select using (true);
create policy "cafe_info write: admin" on public.cafe_info for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- categories: public read, admin write
alter table public.categories enable row level security;
create policy "categories read: public" on public.categories for select using (true);
create policy "categories write: admin" on public.categories for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- products: public read, admin write
alter table public.products enable row level security;
create policy "products read: public" on public.products for select using (true);
create policy "products write: admin" on public.products for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- advertising: public read, admin write
alter table public.advertising enable row level security;
create policy "advertising read: public" on public.advertising for select using (true);
create policy "advertising write: admin" on public.advertising for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- text_banner: public read, admin write
alter table public.text_banner enable row level security;
create policy "text_banner read: public" on public.text_banner for select using (true);
create policy "text_banner write: admin" on public.text_banner for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- profiles: user reads own, admin updates
alter table public.profiles enable row level security;
create policy "profiles read: own" on public.profiles for select
  using (auth.uid() = id or is_admin_true());
create policy "profiles update: admin" on public.profiles for update
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- qr_codes: admin only (saved QR images per table)
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null unique,
  image text not null,
  created_at timestamptz not null default now()
);
alter table public.qr_codes enable row level security;
create policy "qr_codes read: admin" on public.qr_codes for select
  using (is_admin_true());
create policy "qr_codes write: admin" on public.qr_codes for all
  using (is_admin_true())
  with check (is_admin_true());

-- Robust admin-only delete for saved QR codes (security-definer RPC).
create or replace function public.delete_saved_qr(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_true() then
    raise exception 'Forbidden';
  end if;
  delete from public.qr_codes where id = p_id;
end;
$$;

revoke all on function public.delete_saved_qr(uuid) from public;
grant execute on function public.delete_saved_qr(uuid) to authenticated;

-- ============================================================
-- 3. Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (new.id, new.email, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. Realtime (WebSocket postgres_changes)
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['public.cafe_info', 'public.categories', 'public.products', 'public.advertising', 'public.text_banner', 'public.qr_codes'] loop
    begin
      execute format('alter publication supabase_realtime add table %s', t);
    exception when duplicate_object then
      null; -- вже є в публікації
    end;
  end loop;
end $$;

-- ============================================================
-- 5. Make the first admin
-- Replace 'ADMIN_EMAIL' with your admin email and run once:
-- ============================================================
-- update public.profiles set is_admin = true where email = 'svitkavyvisk@gmail.com';
-- (If the user already signed up, the trigger created a profile row above.)
