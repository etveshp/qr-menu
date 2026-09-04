-- Migration: Фаза 7.31 — Photos moved into Supabase Storage (bucket + policies).
-- Idempotent: safe to run again. Only creates the bucket and storage RLS rules;
-- existing base64 values are moved by scripts/backfill-photos.mjs (service role).

-- 1. Bucket (public read; images of the menu are shown to anonymous visitors)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-photos',
  'menu-photos',
  true,
  5242880, -- 5 MB, originals are validated <= 1 MB upstream
  array['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/avif']
)
on conflict (id) do nothing;

-- 2. RLS policies on storage.objects (idempotent)
drop policy if exists "menu-photos read: public" on storage.objects;
drop policy if exists "menu-photos write: admin" on storage.objects;

create policy "menu-photos read: public" on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-photos');

create policy "menu-photos write: admin" on storage.objects for all
  to authenticated
  using (
    bucket_id = 'menu-photos'
    and auth.uid() in (select id from public.profiles where is_admin = true)
  )
  with check (
    bucket_id = 'menu-photos'
    and auth.uid() in (select id from public.profiles where is_admin = true)
  );
