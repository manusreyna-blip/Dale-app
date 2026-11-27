-- dale. · permisos explícitos para usuarios con sesión iniciada
-- Los proyectos nuevos de Supabase ya no otorgan permisos automáticos sobre las tablas de `public`.
-- Acá se dan solo los permisos que la app necesita; las reglas de fila (RLS) de 0001 siguen
-- decidiendo QUÉ filas ve o cambia cada persona. Los visitantes anónimos (`anon`) no reciben nada.

grant usage on schema public to authenticated;

-- lectura (filtrada por RLS)
grant select on public.profiles, public.organizations, public.opportunities, public.swipes, public.messages
  to authenticated;

-- perfil: solo columnas que la persona puede editar (no has_background_check)
grant update (role, first_name, zone, availability, causes) on public.profiles to authenticated;

-- entidades: alta y edición sin poder tocar verification_status ni verification_label
grant insert (owner_id, name, cause, zone, is_formal, verification_method, team, impact, auto_accept)
  on public.organizations to authenticated;
grant update (name, cause, zone, team, impact, auto_accept) on public.organizations to authenticated;

-- datos privados de la entidad (solo la dueña, por RLS)
grant select, insert, update, delete on public.org_private to authenticated;

-- pedidos de la entidad (solo la dueña, por RLS)
grant insert, update, delete on public.opportunities to authenticated;

-- chat y reportes
grant insert on public.messages, public.reports to authenticated;

-- swipes: sin permisos de escritura directa; todo pasa por las funciones swipe / decide_interest / confirm_meeting
