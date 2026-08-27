-- Migration: Фаза 6.5 — RLS через profiles + Realtime publication (live БД)
-- Ідемпотентна: безпечно запускати повторно.

-- 1. Профіль адміна (якщо користувач уже є в auth.users)
insert into public.profiles (id, email, is_admin)
select id, email, true from auth.users where email = 'svitkavyvisk@gmail.com'
on conflict (id) do update set is_admin = true, email = excluded.email;

-- 2. Допоміжна функція is_admin_true() (для політики profiles read)
create or replace function public.is_admin_true()
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
$$;

-- 3. RLS-політики через profiles (замість застарілої перевірки JWT role)
alter table public.cafe_info enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "cafe_info read: public" on public.cafe_info;
drop policy if exists "cafe_info write: admin" on public.cafe_info;
drop policy if exists "categories read: public" on public.categories;
drop policy if exists "categories write: admin" on public.categories;
drop policy if exists "products read: public" on public.products;
drop policy if exists "products write: admin" on public.products;
drop policy if exists "profiles read: own" on public.profiles;
drop policy if exists "profiles update: admin" on public.profiles;

create policy "cafe_info read: public" on public.cafe_info for select using (true);
create policy "cafe_info write: admin" on public.cafe_info for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

create policy "categories read: public" on public.categories for select using (true);
create policy "categories write: admin" on public.categories for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

create policy "products read: public" on public.products for select using (true);
create policy "products write: admin" on public.products for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

create policy "profiles read: own" on public.profiles for select
  using (auth.uid() = id or is_admin_true());
create policy "profiles update: admin" on public.profiles for update
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

-- 4. Тригер автостворення профілю при реєстрації
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

-- 5. Realtime publication (ідемпотентно, не видаляючи публікацію)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['public.cafe_info', 'public.categories', 'public.products'] loop
    begin
      execute format('alter publication supabase_realtime add table %s', t);
    exception when duplicate_object then
      null; -- вже є в публікації
    end;
  end loop;
end $$;
