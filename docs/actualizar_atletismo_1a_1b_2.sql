-- =====================================================================
--  Actualiza (reconcilia) Atletismo 1A, 1B y 2 Lunes con la hoja nueva
--  Pegar entero en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- No toca "Lunes Atletismo Adultos" (Antón lo excluyó explícitamente).
-- Igual que la sincronización de siempre: añade a quien falte y QUITA
-- (del grupo, no borra al deportista) a quien ya no esté en esta lista
-- para Peques A, Peques B y Medio.

with roster(nombre, grupo_nombre) as (
  values
  ('Carlos Pereda Lostau', 'Lunes Atletismo Peques A'),
  ('Diara Alexa García López', 'Lunes Atletismo Peques A'),
  ('Alana Gómez García', 'Lunes Atletismo Peques A'),
  ('Leon Strumbo Wilson', 'Lunes Atletismo Peques A'),
  ('Lola López Moreno', 'Lunes Atletismo Peques A'),
  ('Lorenzo Bernal Carpio', 'Lunes Atletismo Peques A'),
  ('Luna González Serralta', 'Lunes Atletismo Peques A'),
  ('María Simpson', 'Lunes Atletismo Peques A'),
  ('Mario tejero maria', 'Lunes Atletismo Peques A'),
  ('Martín Arribas del Amo', 'Lunes Atletismo Peques A'),
  ('TULIO RUIZ DELGADO', 'Lunes Atletismo Peques A'),
  ('Rosa Strumbo Wilson', 'Lunes Atletismo Peques A'),
  ('Saúl Niño Negreira', 'Lunes Atletismo Peques A'),

  ('Maria Moreno', 'Lunes Atletismo Peques B'),
  ('Jorge del Río Serrano', 'Lunes Atletismo Peques B'),
  ('Jara Lahera Sánchez', 'Lunes Atletismo Peques B'),
  ('Alba García Palacios', 'Lunes Atletismo Peques B'),
  ('EMMA GONZÁLEZ VERDÚ', 'Lunes Atletismo Peques B'),
  ('Sara Fernández Martín', 'Lunes Atletismo Peques B'),
  ('SARA GARCÍA VILLAMARÍN', 'Lunes Atletismo Peques B'),
  ('Chloé Lucia Sanz Rodríguez', 'Lunes Atletismo Peques B'),
  ('Vega Delgado de Felix', 'Lunes Atletismo Peques B'),
  ('Hugo Jiménez Ocaña', 'Lunes Atletismo Peques B'),
  ('Luca Fararoni Bitar', 'Lunes Atletismo Peques B'),
  ('Martín Arribas del Amo', 'Lunes Atletismo Peques B'),
  ('Quique López Moreno', 'Lunes Atletismo Peques B'),
  ('david de lorenzo Macías', 'Lunes Atletismo Peques B'),

  ('María Caballero de la Cruz', 'Lunes Atletismo Medio'),
  ('Julia Millo Bretin', 'Lunes Atletismo Medio'),
  ('Anaïs Rodriguez Bastiani', 'Lunes Atletismo Medio'),
  ('Gorka Hernando Muñoz', 'Lunes Atletismo Medio'),
  ('Arán Fernández Martín', 'Lunes Atletismo Medio'),
  ('Celia Pereda Lostau', 'Lunes Atletismo Medio'),
  ('Isabel Simpson', 'Lunes Atletismo Medio'),
  ('Alba García Palacios', 'Lunes Atletismo Medio'),
  ('Saul Tabasco Alonso', 'Lunes Atletismo Medio'),
  ('Daniel Bárez Carballo', 'Lunes Atletismo Medio'),
  ('ALICIA DELGADO PRIETO', 'Lunes Atletismo Medio'),
  ('Alejandro Martín-Velasco Suárez', 'Lunes Atletismo Medio'),
  ('Martina Pous Ribagorda', 'Lunes Atletismo Medio'),
  ('Hugo Simon Perez', 'Lunes Atletismo Medio')
),
grupos_norm as (
  select g.id as grupo_id,
    regexp_replace(unaccent(lower(trim(g.nombre))), '\s+', ' ', 'g') as clave
  from grupos g
  where g.nombre in ('Lunes Atletismo Peques A', 'Lunes Atletismo Peques B', 'Lunes Atletismo Medio')
),
roster_con_grupo as (
  select r.nombre,
    regexp_replace(unaccent(lower(trim(r.grupo_nombre))), '\s+', ' ', 'g') as clave
  from roster r
),
esperados as (
  select distinct nombre from roster
),
a_insertar as (
  select e.nombre
  from esperados e
  where not exists (
    select 1 from deportistas d
    where unaccent(lower(d.nombre)) = unaccent(lower(e.nombre))
  )
),
insertados as (
  insert into deportistas (nombre, activo)
  select nombre, true from a_insertar
  returning id, nombre
),
todos as (
  select id, nombre from insertados
  union all
  select d.id, d.nombre from deportistas d
  where unaccent(lower(d.nombre)) in (select unaccent(lower(nombre)) from esperados)
),
roster_ids as (
  select distinct t.id as deportista_id, gn.grupo_id
  from roster_con_grupo rc
  join todos t on unaccent(lower(t.nombre)) = unaccent(lower(rc.nombre))
  join grupos_norm gn on gn.clave = rc.clave
)
delete from deportista_grupo dg
using grupos_norm gn
where dg.grupo_id = gn.grupo_id
  and not exists (
    select 1 from roster_ids ri
    where ri.grupo_id = dg.grupo_id and ri.deportista_id = dg.deportista_id
  );

with roster(nombre, grupo_nombre) as (
  values
  ('Carlos Pereda Lostau', 'Lunes Atletismo Peques A'),
  ('Diara Alexa García López', 'Lunes Atletismo Peques A'),
  ('Alana Gómez García', 'Lunes Atletismo Peques A'),
  ('Leon Strumbo Wilson', 'Lunes Atletismo Peques A'),
  ('Lola López Moreno', 'Lunes Atletismo Peques A'),
  ('Lorenzo Bernal Carpio', 'Lunes Atletismo Peques A'),
  ('Luna González Serralta', 'Lunes Atletismo Peques A'),
  ('María Simpson', 'Lunes Atletismo Peques A'),
  ('Mario tejero maria', 'Lunes Atletismo Peques A'),
  ('Martín Arribas del Amo', 'Lunes Atletismo Peques A'),
  ('TULIO RUIZ DELGADO', 'Lunes Atletismo Peques A'),
  ('Rosa Strumbo Wilson', 'Lunes Atletismo Peques A'),
  ('Saúl Niño Negreira', 'Lunes Atletismo Peques A'),

  ('Maria Moreno', 'Lunes Atletismo Peques B'),
  ('Jorge del Río Serrano', 'Lunes Atletismo Peques B'),
  ('Jara Lahera Sánchez', 'Lunes Atletismo Peques B'),
  ('Alba García Palacios', 'Lunes Atletismo Peques B'),
  ('EMMA GONZÁLEZ VERDÚ', 'Lunes Atletismo Peques B'),
  ('Sara Fernández Martín', 'Lunes Atletismo Peques B'),
  ('SARA GARCÍA VILLAMARÍN', 'Lunes Atletismo Peques B'),
  ('Chloé Lucia Sanz Rodríguez', 'Lunes Atletismo Peques B'),
  ('Vega Delgado de Felix', 'Lunes Atletismo Peques B'),
  ('Hugo Jiménez Ocaña', 'Lunes Atletismo Peques B'),
  ('Luca Fararoni Bitar', 'Lunes Atletismo Peques B'),
  ('Martín Arribas del Amo', 'Lunes Atletismo Peques B'),
  ('Quique López Moreno', 'Lunes Atletismo Peques B'),
  ('david de lorenzo Macías', 'Lunes Atletismo Peques B'),

  ('María Caballero de la Cruz', 'Lunes Atletismo Medio'),
  ('Julia Millo Bretin', 'Lunes Atletismo Medio'),
  ('Anaïs Rodriguez Bastiani', 'Lunes Atletismo Medio'),
  ('Gorka Hernando Muñoz', 'Lunes Atletismo Medio'),
  ('Arán Fernández Martín', 'Lunes Atletismo Medio'),
  ('Celia Pereda Lostau', 'Lunes Atletismo Medio'),
  ('Isabel Simpson', 'Lunes Atletismo Medio'),
  ('Alba García Palacios', 'Lunes Atletismo Medio'),
  ('Saul Tabasco Alonso', 'Lunes Atletismo Medio'),
  ('Daniel Bárez Carballo', 'Lunes Atletismo Medio'),
  ('ALICIA DELGADO PRIETO', 'Lunes Atletismo Medio'),
  ('Alejandro Martín-Velasco Suárez', 'Lunes Atletismo Medio'),
  ('Martina Pous Ribagorda', 'Lunes Atletismo Medio'),
  ('Hugo Simon Perez', 'Lunes Atletismo Medio')
),
grupos_norm as (
  select g.id as grupo_id,
    regexp_replace(unaccent(lower(trim(g.nombre))), '\s+', ' ', 'g') as clave
  from grupos g
  where g.nombre in ('Lunes Atletismo Peques A', 'Lunes Atletismo Peques B', 'Lunes Atletismo Medio')
),
roster_con_grupo as (
  select r.nombre,
    regexp_replace(unaccent(lower(trim(r.grupo_nombre))), '\s+', ' ', 'g') as clave
  from roster r
),
esperados as (
  select distinct nombre from roster
),
existentes as (
  select d.id, d.nombre from deportistas d
  where unaccent(lower(d.nombre)) in (select unaccent(lower(nombre)) from esperados)
)
insert into deportista_grupo (deportista_id, grupo_id)
select distinct e.id, gn.grupo_id
from roster_con_grupo rc
join existentes e on unaccent(lower(e.nombre)) = unaccent(lower(rc.nombre))
join grupos_norm gn on gn.clave = rc.clave
on conflict do nothing;

select g.nombre, count(dg.deportista_id) as num_deportistas
from grupos g
left join deportista_grupo dg on dg.grupo_id = g.id
where g.nombre in ('Lunes Atletismo Peques A', 'Lunes Atletismo Peques B', 'Lunes Atletismo Medio')
group by g.nombre
order by g.nombre;
