-- =====================================================================
--  Jornadas y talleres de promoción en colegios (duatlón, acuatlón...)
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
--
--  fecha_horario es texto libre (no una fecha real) porque en la
--  práctica cada colegio lo describe distinto: "11 de marzo miércoles/13
--  de marzo viernes de 9 a 11h", "8 de junio de 9 a 13h de 1 a 4"... No
--  merece la pena forzar un formato de fecha rígido para esto.
-- =====================================================================

create table jornadas_colegios (
  id            bigint generated always as identity primary key,
  anio          int  not null,
  colegio       text not null,
  fecha_horario text not null,
  disciplina    text not null,
  creado_por    uuid references perfiles (id),
  creado_en     timestamptz not null default now()
);

create index on jornadas_colegios (anio desc);

-- Quién del club da cada taller. Igual que sesion_grupo con sesiones: una
-- jornada puede tener varios entrenadores (ej. "Nimai y Laura").
create table jornada_entrenador (
  jornada_id    bigint not null references jornadas_colegios (id) on delete cascade,
  entrenador_id uuid   not null references perfiles (id) on delete cascade,
  primary key (jornada_id, entrenador_id)
);

alter table jornadas_colegios  enable row level security;
alter table jornada_entrenador enable row level security;

-- Solo gestión administrativa del director, igual que facturas y pedidos.
create policy p_jornadas_leer   on jornadas_colegios for select using (es_director());
create policy p_jornadas_crear  on jornadas_colegios for insert with check (es_director());
create policy p_jornadas_borrar on jornadas_colegios for delete using (es_director());

create policy p_jornent_leer  on jornada_entrenador for select using (es_director());
create policy p_jornent_admin on jornada_entrenador for all
  using (es_director()) with check (es_director());
