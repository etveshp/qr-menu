-- Deleting a saved QR from the cabinet. A security-definer RPC is more robust
-- than a client DELETE through PostgREST (which can surface opaque errors);
-- the function still checks that the caller is an admin before deleting.
create or replace function public.delete_saved_qr(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_true() then
    raise exception 'Forbidden';
  end if;
  delete from public.qr_codes where id = p_id;
end;
$$;

revoke all on function public.delete_saved_qr(uuid) from public;
grant execute on function public.delete_saved_qr(uuid) to authenticated;
