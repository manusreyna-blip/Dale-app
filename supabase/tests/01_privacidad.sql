\set ON_ERROR_STOP 0
-- users
insert into auth.users values ('00000000-0000-0000-0000-00000000000a','vol@x'),('00000000-0000-0000-0000-00000000000b','vol2@x'),('00000000-0000-0000-0000-00000000000c','org@x'),('00000000-0000-0000-0000-00000000000d','org2@x');
create function pg_temp.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
set role authenticated;

-- ORG C creates org + private + opp
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
update profiles set role='org' where id=auth.uid();
insert into organizations(owner_id,name,cause,zone,verification_method,auto_accept) values (auth.uid(),'Merendero Test','Niñez','Lanús','referents',false);
insert into org_private select id,'Calle Secreta 123','CUIT' from organizations where owner_id=auth.uid();
insert into opportunities(org_id,need,schedule,availability) select id,'Apoyo escolar sábados','Sábados 16h','{"Fines de semana"}' from organizations where owner_id=auth.uid();
\echo T1 org cannot self-verify (expect permission denied)
update organizations set verification_status='verified' where owner_id=auth.uid();

-- ORG D creates unverified org
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
insert into organizations(owner_id,name,cause,zone,verification_method,auto_accept) values (auth.uid(),'Sin verificar','Niñez','Moreno','photos',true);
insert into opportunities(org_id,need,schedule,availability) select id,'Algo no verificado','Lunes','{"Fines de semana"}' from organizations where owner_id=auth.uid();

-- admin verifies C only
reset role; update organizations set verification_status='verified', verification_label='Validada por referentes' where name='Merendero Test'; set role authenticated;

-- VOLUNTEER A
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update profiles set role='volunteer', first_name='Manu', zone='Constitución', availability='Fines de semana', causes='{Niñez}' where id=auth.uid();
\echo T2 volunteer cannot self-set background check (expect permission denied)
update profiles set has_background_check=true where id=auth.uid();
\echo T3 feed shows only verified (expect 1 row: Merendero Test)
select org_name, need from feed('{Niñez}','Fines de semana');
\echo T4 volunteer cannot read org_private (expect 0 rows)
select * from org_private;
\echo T5 cannot insert swipe directly (expect permission denied)
insert into swipes(volunteer_id,opportunity_id,liked,status) select auth.uid(), id, true, 'accepted' from opportunities limit 1;
\echo T6 swipe like on verified opp (expect pending)
select status from swipe((select id from opportunities where need like 'Apoyo%'), true);
\echo T7 swipe on unverified opp (expect error)
select status from swipe((select o.id from opportunities o join organizations g on g.id=o.org_id where g.name='Sin verificar'), true);
\echo T8 cannot message before accepted (expect RLS violation)
insert into messages(swipe_id,sender_id,body) select id, auth.uid(), 'hola' from swipes;
\echo T9 volunteer cannot decide own interest (expect not allowed)
select decide_interest((select id from swipes limit 1), true);
\echo T9b feed no longer shows swiped (expect 0 rows)
select count(*) from feed('{Niñez}','Fines de semana');

-- VOLUNTEER B cannot see A
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
\echo T10 other volunteer sees no profiles but own, no swipes (expect 1, 0)
select count(*) from profiles; select count(*) from swipes;

-- ORG D (not owner) cannot see A's profile
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
\echo T11 unrelated org sees 1 profile (own) and 0 candidates
select count(*) from profiles; select count(*) from org_candidates('pending');

-- ORG C sees candidate, accepts
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
\echo T12 owner org sees candidate Manu
select first_name, zone, has_background_check from org_candidates('pending');
\echo T13 org cannot see volunteer email (auth.users) (expect permission denied)
select email from auth.users;
select decide_interest((select id from swipes limit 1), true);
\echo T14 address hidden before meeting (expect null)
select get_meeting_address((select id from swipes limit 1));
insert into messages(swipe_id,sender_id,body) select id, auth.uid(), 'Bienvenida!' from swipes;

-- VOLUNTEER A chat + confirm
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into messages(swipe_id,sender_id,body) select id, auth.uid(), 'Gracias!' from swipes;
\echo T15 volunteer sees 2 messages
select count(*) from messages;
select confirm_meeting((select id from swipes limit 1));
\echo T16 address visible after meeting
select get_meeting_address((select id from swipes limit 1));
\echo T17 impact
select * from my_impact();

-- B cannot read messages or address
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
\echo T18 outsider sees 0 messages and null address
select count(*) from messages; select get_meeting_address((select id from swipes limit 1));

-- delete account cascade
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select delete_my_account();
reset role;
\echo T19 after delete: users, swipes, messages
select count(*) from auth.users; select count(*) from swipes; select count(*) from messages;
\echo T20 anon cannot call feed
set role anon; select * from feed('{Niñez}','Fines de semana');
