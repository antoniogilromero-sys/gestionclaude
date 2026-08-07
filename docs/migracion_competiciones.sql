-- =====================================================================
--  Resultados de competiciones (duatlón, triatlón, acuatlón...) de los
--  deportistas del club, por temporada. Pegar en Supabase > SQL Editor
--  > Run (una sola vez).
--
--  Esto es distinto de `resultados` (los tests de entrenamiento con
--  catálogo fijo de 20 pruebas): una competición es un evento externo
--  puntual, con su propio nombre y clasificación, no una prueba
--  estandarizada del club.
-- =====================================================================

create table competiciones (
  id             bigint generated always as identity primary key,
  deportista_id  bigint not null references deportistas (id) on delete cascade,
  anio           int  not null,
  nombre_carrera text not null,
  fecha          date,
  disciplina     text not null,
  tiempo         text,
  clasificacion  text,
  creado_por     uuid references perfiles (id),
  creado_en      timestamptz not null default now()
);

create index on competiciones (anio desc);
create index on competiciones (deportista_id);

alter table competiciones enable row level security;

create policy p_competiciones_leer   on competiciones for select using (es_director());
create policy p_competiciones_crear  on competiciones for insert with check (es_director());
create policy p_competiciones_borrar on competiciones for delete using (es_director());
