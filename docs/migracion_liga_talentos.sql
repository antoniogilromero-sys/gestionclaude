-- Liga de Talentos: seguimiento propio de un grupo de cadetes, separado
-- del catálogo fijo de tests del club (`tipos_test`/`resultados`) porque
-- aquí las pruebas son las que decida Antón sobre la marcha (texto libre
-- en `prueba`), no un catálogo cerrado. Solo director — a propósito, es
-- un programa más reducido/sensible que el resto de rendimiento.
--
-- Dos tablas, porque son dos formatos de dato distintos:
--   - liga_talentos_marcas: una prueba, un tiempo (natación 300m,
--     carrera 1600m...).
--   - liga_talentos_carreras: carreras con tramos (duatlón: carrera,
--     T1, bici, T2, carrera), y a veces el resultado es de un equipo de
--     relevos, no de un deportista suelto — por eso `deportista_id` es
--     opcional y hay un campo `equipo` para esos casos.

create table liga_talentos_marcas (
  id            bigint generated always as identity primary key,
  deportista_id bigint not null references deportistas (id) on delete cascade,
  prueba        text not null,
  tiempo_s      numeric(7,2) not null,
  fecha         date not null default current_date,
  notas         text,
  creado_por    uuid references perfiles (id),
  creado_en     timestamptz not null default now()
);

create table liga_talentos_carreras (
  id            bigint generated always as identity primary key,
  deportista_id bigint references deportistas (id) on delete cascade,
  equipo        text,
  carrera       text not null,
  carrera_s     numeric(7,2),
  t1_s          numeric(7,2),
  bici_s        numeric(7,2),
  t2_s          numeric(7,2),
  correr_s      numeric(7,2),
  total_s       numeric(7,2) not null,
  fecha         date not null default current_date,
  notas         text,
  creado_por    uuid references perfiles (id),
  creado_en     timestamptz not null default now(),
  constraint deportista_o_equipo check (deportista_id is not null or equipo is not null)
);

alter table liga_talentos_marcas enable row level security;
alter table liga_talentos_carreras enable row level security;

create policy p_liga_marcas_todo on liga_talentos_marcas
  for all using (es_director()) with check (es_director());

create policy p_liga_carreras_todo on liga_talentos_carreras
  for all using (es_director()) with check (es_director());
