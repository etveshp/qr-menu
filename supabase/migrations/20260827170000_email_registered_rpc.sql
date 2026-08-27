-- Migration: RPC email_registered — чи існує користувач з таким email.
-- Потрібно, щоб відрізнити «невірний пароль» (email зареєстровано) від
-- «пошта не зареєстрована» (Supabase повертає invalid_credentials в обох випадках).
-- SECURITY DEFINER: читає auth.users в обхід RLS.
-- Увага: розкриває факт реєстрації email — прийнятно для адмін-входу.

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

grant execute on function public.email_registered(text) to anon, authenticated;
