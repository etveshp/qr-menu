-- Supabase schema for Aura Cafe QR-Menu
-- Run this in Supabase SQL Editor after creating the project.

-- 1. Tables
create table public.cafe_info (
  id integer primary key default 1,
  name text not null default '',
  description text not null default '',
  banner text not null default '',
  logo text not null default '',
  instagram text not null default '',
  banner_x integer not null default 50,
  banner_y integer not null default 50,
  banner_scale real not null default 1,
  logo_x integer not null default 50,
  logo_y integer not null default 50,
  logo_scale real not null default 1,
  updated_at timestamptz not null default now()
);

-- Ensure only one row
alter table public.cafe_info enable row level security;
create policy "cafe_info read: public" on public.cafe_info for select using (true);
create policy "cafe_info write: admin" on public.cafe_info for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

create table public.categories (
  id text primary key,
  name_uk text not null,
  name_hu text not null default '',
  name_en text not null default '',
  photo text not null default '',
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories read: public" on public.categories for select using (true);
create policy "categories write: admin" on public.categories for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

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
  price numeric not null check (price >= 0),
  photo text not null default '',
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "products read: public" on public.products for select using (true);
create policy "products write: admin" on public.products for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- 2. Admin role function
-- Create a function to set admin role for a user (callable by service role)
create or replace function public.set_admin(uid uuid, is_admin boolean)
returns void
language plpgsql
security definer
as $$
begin
  update auth.users
  set raw_app_meta_data = 
    case when is_admin 
      then jsonb_set(coalesce(raw_app_meta_data, '{}'), '{role}', '"admin"')
      else raw_app_meta_data - 'role'
    end
  where id = uid;
end;
$$;

-- Or simpler: use a profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles read: own" on public.profiles for select
  using (auth.uid() = id or auth.jwt() ->> 'role' = 'admin');
create policy "profiles update: admin" on public.profiles for update
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');