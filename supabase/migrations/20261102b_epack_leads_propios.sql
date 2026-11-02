-- Cada comercial solo ve, edita y borra sus propios leads; el manager, todos.
alter policy epack_leads_team_select on public.epack_leads
  using (public.epack_is_manager() or (created_by = (select auth.uid()) and public.epack_can_access_event(event_id)));
alter policy epack_leads_team_manage on public.epack_leads
  using (public.epack_is_manager() or (created_by = (select auth.uid()) and public.epack_can_access_event(event_id)))
  with check (public.epack_is_manager() or (created_by = (select auth.uid()) and public.epack_can_access_event(event_id)));
alter policy epack_leads_team_delete on public.epack_leads
  using (public.epack_is_manager() or (created_by = (select auth.uid()) and public.epack_can_access_event(event_id)));
alter policy epack_leads_team_insert on public.epack_leads
  with check (created_by = (select auth.uid()) and public.epack_can_access_event(event_id) and capture_method = any (array['manual','card_scan']));

-- El QR público ya usa epack_event_by_slug: sin sesión no se puede listar eventos.
drop policy if exists epack_events_anon_select_tmp on public.epack_events;
