create role anon nologin; create role authenticated nologin;
create schema auth; grant usage on schema auth to authenticated, anon;
create table auth.users(id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant execute on function auth.uid() to authenticated, anon;
create publication supabase_realtime;
grant usage on schema public to authenticated, anon;
alter default privileges in schema public grant all on tables to authenticated, anon;
