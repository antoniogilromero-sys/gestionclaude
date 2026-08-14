-- =====================================================================
--  Próximas competiciones: calendario de carreras a las que va el club,
--  ANTES de que sucedan. Distinto de `competiciones` (los resultados de
--  cada deportista, que se rellenan cuando la carrera ya ha pasado) — no
--  está ligado a deportistas concretos, es solo "qué carreras vienen",
--  útil para avisar a las familias.
--
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================

create table proximas_competiciones (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  fecha       date,                 -- puede quedar sin confirmar todavía
  lugar       text,
  disciplina  text not null,
  notas       text,
  creado_por  uuid references perfiles (id),
  creado_en   timestamptz not null default now()
);

create index on proximas_competiciones (fecha);

alter table proximas_competiciones enable row level security;

-- Igual que competiciones: director y entrenador ven el calendario,
-- solo el director lo gestiona.
create policy p_proximas_leer   on proximas_competiciones for select using (aprobado());
create policy p_proximas_crear  on proximas_competiciones for insert with check (es_director());
create policy p_proximas_borrar on proximas_competiciones for delete using (es_director());
