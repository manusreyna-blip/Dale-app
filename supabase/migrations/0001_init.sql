-- dale. · esquema inicial
-- Principios de privacidad:
--  * Nadie ve el email ni el teléfono de nadie (viven en auth.users, inaccesible desde la app).
--  * La dirección exacta de una entidad vive en org_private y solo se revela al voluntario
--    aceptado cuando se confirma el primer encuentro (función get_meeting_address).
--  * Una entidad solo ve el perfil resumido de quienes le dieron "dale" a sus pedidos.
--  * Los cambios de estado (match, aceptar, confirmar) pasan por funciones que validan permisos;
--    no hay UPDATE directo sobre swipes.
--  * has_background_check y verification_status solo los cambia un administrador (dashboard de Supabase).

create extension if not exists pgcrypto;

-- ───────────────────────── tablas ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('volunteer', 'org')),
  first_name text check (char_length(first_name) <= 40),
  zone text check (char_length(zone) <= 80),
  availability text,
  causes text[] not null default '{}',
  has_background_check boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  cause text not null,
  zone text not null check (char_length(zone) <= 80),
  is_formal boolean not null default false,
  verification_method text not null check (verification_method in ('legal', 'referents', 'photos')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  verification_label text not null default 'Verificación en curso',
  team text not null default '',
  impact text not null default '',
  auto_accept boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.org_private (
  org_id uuid primary key references public.organizations on delete cascade,
  exact_address text,
  verification_detail text -- CUIT / IGJ o contactos de referentes; nunca se publica
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  need text not null check (char_length(need) between 5 and 400),
  schedule text not null check (char_length(schedule) <= 120),
  availability text[] not null default '{}',
  requires_background_check boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references auth.users on delete cascade,
  opportunity_id uuid not null references public.opportunities on delete cascade,
  liked boolean not null,
  status text check (status in ('pending', 'accepted', 'rejected')),
  meeting_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (volunteer_id, opportunity_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  swipe_id uuid not null references public.swipes on delete cascade,
  sender_id uuid not null references auth.users on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  swipe_id uuid references public.swipes on delete set null,
  reporter_id uuid references auth.users on delete set null,
  reason text not null check (char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);

create index on public.opportunities (org_id);
create index on public.swipes (opportunity_id);
create index on public.messages (swipe_id, created_at);

-- Perfil vacío al registrarse
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── helpers ─────────────────────────
create function public.owns_opportunity(p_opp uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.opportunities o join public.organizations g on g.id = o.org_id
    where o.id = p_opp and g.owner_id = auth.uid())
$$;

create function public.is_participant(p_swipe uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.swipes s
    join public.opportunities o on o.id = s.opportunity_id
    join public.organizations g on g.id = o.org_id
    where s.id = p_swipe and (s.volunteer_id = auth.uid() or g.owner_id = auth.uid()))
$$;

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_private enable row level security;
alter table public.opportunities enable row level security;
alter table public.swipes enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

-- profiles: lo propio + entidades ven a quienes les dieron dale
create policy "profile self read" on public.profiles for select using (id = auth.uid());
create policy "profile visible to orgs that got a like" on public.profiles for select using (
  exists (select 1 from public.swipes s where s.volunteer_id = profiles.id and s.liked and public.owns_opportunity(s.opportunity_id)));
create policy "profile self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (role, first_name, zone, availability, causes) on public.profiles to authenticated;

-- organizations
create policy "orgs visible when verified or own" on public.organizations for select
  using (verification_status = 'verified' or owner_id = auth.uid());
create policy "org insert own" on public.organizations for insert with check (owner_id = auth.uid());
create policy "org update own" on public.organizations for update using (owner_id = auth.uid());
revoke insert, update on public.organizations from authenticated, anon;
grant insert (owner_id, name, cause, zone, is_formal, verification_method, team, impact, auto_accept) on public.organizations to authenticated;
grant update (name, cause, zone, team, impact, auto_accept) on public.organizations to authenticated;

-- org_private: solo la dueña
create policy "org private own" on public.org_private for all
  using (exists (select 1 from public.organizations g where g.id = org_id and g.owner_id = auth.uid()))
  with check (exists (select 1 from public.organizations g where g.id = org_id and g.owner_id = auth.uid()));

-- opportunities
create policy "opps visible" on public.opportunities for select using (
  exists (select 1 from public.organizations g where g.id = org_id
          and ((g.verification_status = 'verified' and active) or g.owner_id = auth.uid())));
create policy "opps write own" on public.opportunities for all
  using (exists (select 1 from public.organizations g where g.id = org_id and g.owner_id = auth.uid()))
  with check (exists (select 1 from public.organizations g where g.id = org_id and g.owner_id = auth.uid()));

-- swipes: lectura para las dos partes, escritura solo por funciones
create policy "swipes read" on public.swipes for select using (
  volunteer_id = auth.uid() or (liked and public.owns_opportunity(opportunity_id)));
revoke insert, update, delete on public.swipes from authenticated, anon;

-- messages: solo participantes de un match aceptado
create policy "messages read" on public.messages for select using (public.is_participant(swipe_id));
create policy "messages write" on public.messages for insert with check (
  sender_id = auth.uid() and public.is_participant(swipe_id)
  and exists (select 1 from public.swipes s where s.id = swipe_id and s.status = 'accepted'));

-- reports: cualquiera puede reportar, nadie lee desde la app
create policy "reports insert" on public.reports for insert with check (reporter_id = auth.uid());

-- ───────────────────────── funciones de negocio ─────────────────────────
create function public.feed(p_causes text[], p_availability text)
returns table (
  id uuid, org_id uuid, org_name text, cause text, zone text, need text, schedule text,
  availability text[], team text, impact text, is_formal boolean, verification_label text,
  requires_background_check boolean, fits boolean)
language sql stable security invoker set search_path = '' as $$
  select o.id, g.id, g.name, g.cause, g.zone, o.need, o.schedule, o.availability, g.team, g.impact,
         g.is_formal, g.verification_label, o.requires_background_check,
         p_availability = any(o.availability) as fits
  from public.opportunities o
  join public.organizations g on g.id = o.org_id
  where o.active and g.verification_status = 'verified'
    and g.owner_id <> auth.uid()
    and g.cause = any(p_causes)
    and not exists (select 1 from public.swipes s where s.opportunity_id = o.id and s.volunteer_id = auth.uid())
  order by fits desc, o.created_at desc
  limit 50
$$;

create function public.swipe(p_opp uuid, p_liked boolean)
returns table (id uuid, status text)
language plpgsql security definer set search_path = '' as $$
declare v_auto boolean; v_status text; v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select g.auto_accept into v_auto from public.opportunities o join public.organizations g on g.id = o.org_id
   where o.id = p_opp and o.active and g.verification_status = 'verified';
  if not found then raise exception 'opportunity not available'; end if;
  v_status := case when not p_liked then null when v_auto then 'accepted' else 'pending' end;
  insert into public.swipes (volunteer_id, opportunity_id, liked, status)
  values (auth.uid(), p_opp, p_liked, v_status)
  on conflict (volunteer_id, opportunity_id) do update set liked = excluded.liked
  returning swipes.id, swipes.status into v_id, v_status;
  return query select v_id, v_status;
end $$;

create function public.decide_interest(p_swipe uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.swipes s set status = case when p_accept then 'accepted' else 'rejected' end
   where s.id = p_swipe and s.liked and s.status = 'pending' and public.owns_opportunity(s.opportunity_id);
  if not found then raise exception 'not allowed'; end if;
end $$;

create function public.confirm_meeting(p_swipe uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_participant(p_swipe) then raise exception 'not allowed'; end if;
  update public.swipes set meeting_confirmed = true where id = p_swipe and status = 'accepted';
end $$;

create function public.get_meeting_address(p_swipe uuid) returns text
language sql stable security definer set search_path = '' as $$
  select p.exact_address
  from public.swipes s
  join public.opportunities o on o.id = s.opportunity_id
  join public.org_private p on p.org_id = o.org_id
  where s.id = p_swipe and s.status = 'accepted' and s.meeting_confirmed and public.is_participant(p_swipe)
$$;

create function public.org_candidates(p_status text)
returns table (id uuid, first_name text, zone text, availability text, causes text[],
               has_background_check boolean, hours_done int, status text, need text)
language sql stable security definer set search_path = '' as $$
  select s.id, coalesce(pr.first_name, 'Voluntario/a'), coalesce(pr.zone, ''), coalesce(pr.availability, ''),
         pr.causes, pr.has_background_check,
         (select count(*)::int * 2 from public.swipes x where x.volunteer_id = s.volunteer_id and x.meeting_confirmed),
         s.status, o.need
  from public.swipes s
  join public.opportunities o on o.id = s.opportunity_id
  join public.organizations g on g.id = o.org_id
  left join public.profiles pr on pr.id = s.volunteer_id
  where g.owner_id = auth.uid() and s.liked and s.status = p_status
  order by s.created_at desc
$$;

create function public.my_impact() returns table (matches int, meetings int, hours int, causes int)
language sql stable security invoker set search_path = '' as $$
  select count(*)::int, count(*) filter (where s.meeting_confirmed)::int,
         (count(*) filter (where s.meeting_confirmed) * 2)::int, count(distinct g.cause)::int
  from public.swipes s
  join public.opportunities o on o.id = s.opportunity_id
  join public.organizations g on g.id = o.org_id
  where s.volunteer_id = auth.uid() and s.status = 'accepted'
$$;

create function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on all functions in schema public from anon, public;
grant execute on function public.feed, public.swipe, public.decide_interest, public.confirm_meeting,
  public.get_meeting_address, public.org_candidates, public.my_impact, public.delete_my_account,
  public.owns_opportunity, public.is_participant to authenticated;

-- chat en tiempo real (respeta RLS)
alter publication supabase_realtime add table public.messages;
