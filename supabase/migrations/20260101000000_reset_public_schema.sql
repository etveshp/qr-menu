-- Migration: Повне очищення схеми public від даних старої розробки.
-- Скидає схему до чистого стану; подальші міграції створюють все заново.

drop schema if exists public cascade;
create schema public;

grant all on schema public to postgres;
grant all on schema public to public;
grant usage on schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
