-- =====================================================================
--  Avisos para el equipo (aparecen en Inicio)
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Un aviso es una línea corta que ven director y entrenadores en la
-- pantalla de Inicio durante 10 días, por ejemplo "se han subido los
-- resultados del Duatlón de Pinto". Los crea el director (o se cargan
-- por SQL junto con los datos a los que se refieren).

create table avisos (
  id         bigint generated always as identity primary key,
  titulo     text not null,
  texto      text,
  enlace     text,
  creado_por uuid references perfiles (id),
  creado_en  timestamptz not null default now()
);

create index on avisos (creado_en desc);

alter table avisos enable row level security;

create policy p_avisos_leer   on avisos for select using (aprobado());
create policy p_avisos_crear  on avisos for insert with check (es_director());
create policy p_avisos_borrar on avisos for delete using (es_director());
