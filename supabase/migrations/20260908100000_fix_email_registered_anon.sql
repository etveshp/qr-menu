-- Remove anon/public execute access to the email_registered RPC to
-- prevent email enumeration oracle. Only authenticated users can call it.
revoke execute on function public.email_registered(text) from anon, public;
grant execute on function public.email_registered(text) to authenticated;