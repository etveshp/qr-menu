-- Text banner (single row, id = 1): a sticky bar under the menu header.
-- Holds the banner text (can include emojis) and an optional link to a
-- promotional product (category + product). Enabled toggles visibility.

create table if not exists public.text_banner (
  id integer primary key default 1,
  text text not null default '',
  category_id text,
  product_id text,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.text_banner enable row level security;

create policy "text_banner read: public" on public.text_banner for select using (true);
create policy "text_banner write: admin" on public.text_banner for all
  using (auth.uid() in (select id from public.profiles where is_admin = true))
  with check (auth.uid() in (select id from public.profiles where is_admin = true));

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.text_banner';
exception when duplicate_object then
  null; -- вже є в публікації
end $$;
