-- Equipos de una prueba por equipos (ej. 100x100 de natación de Villanueva de
-- la Cañada 2026). Administración > Equipos de prueba (solo director).
--
--   pruebas_equipos         la prueba (nombre, fecha, lugar)
--   prueba_equipo           los equipos de esa prueba (Equipo 1, Equipo 2...)
--   prueba_equipo_miembro   quién va en cada equipo:
--     deportista_id  null si no tiene ficha (alguien de otro club, o aún sin ficha)
--     club           club de origen si NO es del nuestro (ej. GSD)
--     tiempo_s       tiempo de 200 m puesto a mano; si está vacío, la pantalla usa
--                    su mejor 200 m de natación registrado en Tests

create table if not exists pruebas_equipos (
  id        bigint generated always as identity primary key,
  nombre    text not null,
  fecha     date,
  lugar     text,
  notas     text,
  creado_en timestamptz not null default now()
);

create table if not exists prueba_equipo (
  id        bigint generated always as identity primary key,
  prueba_id bigint not null references pruebas_equipos (id) on delete cascade,
  nombre    text not null,
  orden     int not null default 0
);

create table if not exists prueba_equipo_miembro (
  id            bigint generated always as identity primary key,
  equipo_id     bigint not null references prueba_equipo (id) on delete cascade,
  deportista_id bigint references deportistas (id) on delete set null,
  nombre        text not null,
  orden         int not null default 0
);

-- Por si la tabla ya se había creado antes de existir estas dos columnas.
alter table prueba_equipo_miembro
  add column if not exists club     text,
  add column if not exists tiempo_s numeric(8,2);

create index if not exists prueba_equipo_prueba_idx on prueba_equipo (prueba_id);
create index if not exists prueba_miembro_equipo_idx on prueba_equipo_miembro (equipo_id);

alter table pruebas_equipos       enable row level security;
alter table prueba_equipo         enable row level security;
alter table prueba_equipo_miembro enable row level security;

-- Gestión interna del director, como facturas o pagos.
drop policy if exists p_pruebas_equipos_admin on pruebas_equipos;
create policy p_pruebas_equipos_admin on pruebas_equipos
  for all using (es_director()) with check (es_director());
drop policy if exists p_prueba_equipo_admin on prueba_equipo;
create policy p_prueba_equipo_admin on prueba_equipo
  for all using (es_director()) with check (es_director());
drop policy if exists p_prueba_miembro_admin on prueba_equipo_miembro;
create policy p_prueba_miembro_admin on prueba_equipo_miembro
  for all using (es_director()) with check (es_director());
