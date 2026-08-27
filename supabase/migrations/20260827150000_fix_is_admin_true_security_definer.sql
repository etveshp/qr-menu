-- Migration: Fix recursive RLS (54001 stack depth limit exceeded).
-- is_admin_true() must be SECURITY DEFINER so its internal read of profiles
-- bypasses RLS — otherwise the profiles "read: own" policy calling it recurses.

create or replace function public.is_admin_true()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
$$;
