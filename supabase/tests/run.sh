#!/usr/bin/env bash
# Corre las pruebas de privacidad contra un PostgreSQL local vacío (no contra producción).
# Uso: PGHOST=... PGPORT=... PGUSER=postgres ./supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")"
psql -v ON_ERROR_STOP=1 -q -c "drop database if exists dale_test" -c "create database dale_test"
psql -d dale_test -v ON_ERROR_STOP=1 -q -f 00_supabase_stub.sql
psql -d dale_test -v ON_ERROR_STOP=1 -q -f ../migrations/0001_init.sql
psql -d dale_test -v ON_ERROR_STOP=1 -q -f ../migrations/0002_grants.sql
psql -d dale_test -q -f 01_privacidad.sql
