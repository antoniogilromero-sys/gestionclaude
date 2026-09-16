-- =====================================================================
--  RECONCILIACIÓN FINAL — Atletismo Lunes (Peques A / Peques B / Medio)
--  Sustituye a todos los scripts sueltos de hoy. Seguro de re-ejecutar
--  aunque ya hayas corrido alguno de los anteriores (idempotente).
--  Pegar TODO en Supabase > SQL Editor > Run, una sola vez.
-- =====================================================================

-- 1) Fusiona duplicados: "david de lorenzo Macías" y "Martín Arribas del
--    Amo" tienen cada uno dos fichas de deportista (una de la carga
--    vieja, otra de la nueva) — por eso salían mal en grupos y en el
--    desplegable de Tests. Se dejan como un único deportista cada uno.
do $$
declare
  nombre_dup text;
  mantener_id bigint;
  dup_id bigint;
begin
  foreach nombre_dup in array array['david de lorenzo Macías', 'Martín Arribas del Amo']
  loop
    select min(id) into mantener_id
    from deportistas
    where unaccent(lower(nombre)) = unaccent(lower(nombre_dup));

    for dup_id in
      select id from deportistas
      where unaccent(lower(nombre)) = unaccent(lower(nombre_dup))
        and id <> mantener_id
    loop
      perform fusionar_deportistas(mantener_id, dup_id);
    end loop;
  end loop;
end $$;

-- 2) Arán Fernández Martín está en el club temporalmente: se reactiva
update deportistas
set activo = true
where unaccent(lower(nombre)) = unaccent(lower('Arán Fernández Martín'));

-- 3) Roster definitivo de los 3 grupos
--    - Martín Arribas del Amo y Alba García Palacios: SOLO en Peques B
--      (estaban duplicados por error en otro grupo, confirmado por Antón)
--    - Guillermo González Serralta y JAIME CONTRERAS LOPEZ: en Medio
--      (se habían quedado fuera por error de la lista nueva)
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

  ('Guillermo González Serralta', 'Lunes Atletismo Medio'),
  ('JAIME CONTRERAS LOPEZ', 'Lunes Atletismo Medio'),
  ('Hugo Simon Perez', 'Lunes Atletismo Medio'),
  ('María Caballero de la Cruz', 'Lunes Atletismo Medio'),
  ('Julia Millo Bretin', 'Lunes Atletismo Medio'),
  ('Anaïs Rodriguez Bastiani', 'Lunes Atletismo Medio'),
  ('Gorka Hernando Muñoz', 'Lunes Atletismo Medio'),
  ('Arán Fernández Martín', 'Lunes Atletismo Medio'),
  ('Celia Pereda Lostau', 'Lunes Atletismo Medio'),
  ('Isabel Simpson', 'Lunes Atletismo Medio'),
  ('Saul Tabasco Alonso', 'Lunes Atletismo Medio'),
  ('Daniel Bárez Carballo', 'Lunes Atletismo Medio'),
  ('ALICIA DELGADO PRIETO', 'Lunes Atletismo Medio'),
  ('Alejandro Martín-Velasco Suárez', 'Lunes Atletismo Medio'),
  ('Martina Pous Ribagorda', 'Lunes Atletismo Medio')
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

-- 4) Añade a quien falte (el delete de arriba ya dejó limpio lo que sobraba)
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

  ('Guillermo González Serralta', 'Lunes Atletismo Medio'),
  ('JAIME CONTRERAS LOPEZ', 'Lunes Atletismo Medio'),
  ('Hugo Simon Perez', 'Lunes Atletismo Medio'),
  ('María Caballero de la Cruz', 'Lunes Atletismo Medio'),
  ('Julia Millo Bretin', 'Lunes Atletismo Medio'),
  ('Anaïs Rodriguez Bastiani', 'Lunes Atletismo Medio'),
  ('Gorka Hernando Muñoz', 'Lunes Atletismo Medio'),
  ('Arán Fernández Martín', 'Lunes Atletismo Medio'),
  ('Celia Pereda Lostau', 'Lunes Atletismo Medio'),
  ('Isabel Simpson', 'Lunes Atletismo Medio'),
  ('Saul Tabasco Alonso', 'Lunes Atletismo Medio'),
  ('Daniel Bárez Carballo', 'Lunes Atletismo Medio'),
  ('ALICIA DELGADO PRIETO', 'Lunes Atletismo Medio'),
  ('Alejandro Martín-Velasco Suárez', 'Lunes Atletismo Medio'),
  ('Martina Pous Ribagorda', 'Lunes Atletismo Medio')
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
)
insert into deportista_grupo (deportista_id, grupo_id)
select distinct d.id, gn.grupo_id
from roster_con_grupo rc
join deportistas d on unaccent(lower(d.nombre)) = unaccent(lower(rc.nombre))
join grupos_norm gn on gn.clave = rc.clave
on conflict do nothing;

-- 5) Comprobación final: debe salir Peques A: 12, Peques B: 14, Medio: 15
select g.nombre, count(dg.deportista_id) as num_deportistas
from grupos g
left join deportista_grupo dg on dg.grupo_id = g.id
where g.nombre in ('Lunes Atletismo Peques A', 'Lunes Atletismo Peques B', 'Lunes Atletismo Medio')
group by g.nombre
order by g.nombre;

-- 6) Lista completa de cada grupo, para revisar nombre por nombre
select g.nombre as grupo, d.nombre as deportista
from deportista_grupo dg
join deportistas d on d.id = dg.deportista_id
join grupos g on g.id = dg.grupo_id
where g.nombre in ('Lunes Atletismo Peques A', 'Lunes Atletismo Peques B', 'Lunes Atletismo Medio')
order by g.nombre, d.nombre;
