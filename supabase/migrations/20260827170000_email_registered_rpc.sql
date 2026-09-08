create or replace function public.email_registered(p_email text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from auth.users
    where lower(email) = lower(p_email)
  )
$$;

-- Initial grant; later migration 20260908100000 restricts to authenticated only.
