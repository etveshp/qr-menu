-- Advertising popup (9:16)
-- Single row (id = 1) holding the ad popup settings: the ad photo and
-- the delay (seconds) before the popup appears after the client enters
-- the menu.

create table if not exists public.advertising (
  id integer primary key default 1,
  photo text not null default '',
  delay_seconds integer not null default 5 check (delay_seconds >= 0),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.advertising enable row level security;

create policy "advertising read: public" on public.advertising for select using (true);
create policy "advertising write: admin" on public.advertising for all
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
  execute 'alter publication supabase_realtime add table public.advertising';
exception when duplicate_object then
  null; -- вже є в публікації
end $$;
