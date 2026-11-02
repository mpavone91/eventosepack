-- Comerciales asignadas por evento: cada comercial ve solo sus eventos y leads.
create table public.epack_event_members (
  event_id uuid not null references public.epack_events(id) on delete cascade,
  user_id uuid not null references public.epack_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index epack_event_members_user_idx on public.epack_event_members(user_id);
alter table public.epack_event_members enable row level security;

create policy epack_event_members_select on public.epack_event_members
  for select to authenticated
  using (public.epack_is_manager() or user_id = (select auth.uid()));
create policy epack_event_members_insert on public.epack_event_members
  for insert to authenticated with check (public.epack_is_manager());
create policy epack_event_members_delete on public.epack_event_members
  for delete to authenticated using (public.epack_is_manager());

create or replace function public.epack_can_access_event(eid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.epack_is_manager()
    or exists (select 1 from public.epack_events where id = eid and user_id = (select auth.uid()))
    or exists (select 1 from public.epack_event_members where event_id = eid and user_id = (select auth.uid()));
$$;

create or replace function public.epack_event_by_slug(p_slug text)
returns table (id uuid, name text) language sql stable security definer set search_path = public as $$
  select e.id, e.name from public.epack_events e where e.slug = p_slug;
$$;
grant execute on function public.epack_event_by_slug(text) to anon, authenticated;

drop policy epack_events_team_select on public.epack_events;
create policy epack_events_select on public.epack_events
  for select to authenticated using (public.epack_can_access_event(id));
-- Temporal: la versión desplegada del QR público lee el evento como anon.
create policy epack_events_anon_select_tmp on public.epack_events
  for select to anon using (true);

alter policy epack_leads_team_select on public.epack_leads using (public.epack_can_access_event(event_id));
alter policy epack_leads_team_manage on public.epack_leads
  using (public.epack_can_access_event(event_id)) with check (public.epack_can_access_event(event_id));
alter policy epack_leads_team_delete on public.epack_leads using (public.epack_can_access_event(event_id));
alter policy epack_leads_team_insert on public.epack_leads
  with check (public.epack_can_access_event(event_id) and capture_method = any (array['manual','card_scan']));

-- Para no quitar acceso a nadie: comerciales actuales asignadas a los eventos existentes.
insert into public.epack_event_members (event_id, user_id)
select e.id, p.user_id from public.epack_events e cross join public.epack_profiles p
where p.role = 'rep'
on conflict do nothing;
