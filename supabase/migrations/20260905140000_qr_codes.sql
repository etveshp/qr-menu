-- Saved QR codes (one per table). Stores the generated image (PNG data URL)
-- so "Готові QR-коди" can be listed and deleted from the cabinet.

create table if not exists public.qr_codes (
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

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.qr_codes';
exception when duplicate_object then
  null;
end $$;
