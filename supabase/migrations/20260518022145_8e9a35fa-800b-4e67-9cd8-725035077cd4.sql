
-- Fix set_updated_at search path
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Revoke execute on SECURITY DEFINER fns from public/authenticated
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.get_user_role(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- Re-grant minimal: has_role used by RLS so should remain callable via policies (definer runs as owner regardless). Grant authenticated read for client-side guard checks via RPC if needed:
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.get_user_role(uuid) to authenticated;

-- Replace permissive notifications insert policy with a SECURITY DEFINER helper
drop policy if exists "System creates notifications" on public.notifications;
create policy "Users create own notifications" on public.notifications
  for insert to authenticated with check (auth.uid() = user_id);
