-- =====================================================================
--  Arregla los grupos de Atletismo del lunes con sus nombres REALES
--  Pegar entero en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Se descubrió (septiembre 2026) que los grupos reales del lunes en
-- producción se llaman "Lunes Atletismo Peques/Medio/Adultos" — no
-- "Atletismo 1A/2/3 Lunes" como asumía el script anterior (esos nombres
-- nunca llegaron a existir de verdad, por eso no se cargaba nadie). De
-- paso quedó un grupo fantasma "Atletismo 1B Lunes" creado por error,
-- con 5 deportistas mal puestos.
--
-- Este script:
--   1. Divide "Lunes Atletismo Peques" en dos de verdad: "Lunes
--      Atletismo Peques A" (renombrando el que ya existía) y "Lunes
--      Atletismo Peques B" (nuevo, con el mismo horario que el A).
--   2. Borra el grupo fantasma "Atletismo 1B Lunes" y sus vínculos.
--   3. Carga a todo el roster de la Hoja 3 en los 4 grupos reales:
--      Peques A, Peques B, Medio, Adultos.

-- 1) Divide Peques en A y B (mismo horario para las dos)
update grupos set nombre = 'Lunes Atletismo Peques A' where nombre = 'Lunes Atletismo Peques';

insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin)
select 'Lunes Atletismo Peques B', disciplina, dias, hora_inicio, hora_fin
from grupos where nombre = 'Lunes Atletismo Peques A';

-- 2) Borra el grupo fantasma y sus vínculos mal puestos
delete from deportista_grupo
where grupo_id = (select id from grupos where unaccent(lower(nombre)) = 'atletismo 1b lunes');
delete from grupos where unaccent(lower(nombre)) = 'atletismo 1b lunes';

-- 3) Carga el roster completo en los 4 grupos reales
with roster(nombre, grupo_nombre) as (
  values
  ('Angelina De La Rua Mazza', 'Lunes Atletismo Peques A'),
  ('Carlos Pereda Lostau', 'Lunes Atletismo Peques A'),
  ('david de lorenzo Macías', 'Lunes Atletismo Peques A'),
  ('Leon Strumbo Wilson', 'Lunes Atletismo Peques A'),
  ('Lola López Moreno', 'Lunes Atletismo Peques A'),
  ('María Simpson', 'Lunes Atletismo Peques A'),
  ('Mario tejero maria', 'Lunes Atletismo Peques A'),
  ('Martín Arribas del Amo', 'Lunes Atletismo Peques A'),
  ('Quique López Moreno', 'Lunes Atletismo Peques A'),
  ('Rosa Strumbo Wilson', 'Lunes Atletismo Peques A'),
  ('Saúl Niño Negreira', 'Lunes Atletismo Peques A'),
  ('TULIO RUIZ DELGADO', 'Lunes Atletismo Peques A'),
  ('Vega Delgado de Felix', 'Lunes Atletismo Peques A'),
  ('Lucia Simon Perez', 'Lunes Atletismo Peques B'),
  ('Noa Lopez Herrera', 'Lunes Atletismo Peques B'),
  ('Maria Moreno', 'Lunes Atletismo Peques B'),
  ('Jorge del Río Serrano', 'Lunes Atletismo Peques B'),
  ('Jara Lahera Sánchez', 'Lunes Atletismo Peques B'),
  ('Guillermo González Serralta', 'Lunes Atletismo Medio'),
  ('JAIME CONTRERAS LOPEZ', 'Lunes Atletismo Medio'),
  ('María Caballero de la Cruz', 'Lunes Atletismo Medio'),
  ('Julia Millo Bretin', 'Lunes Atletismo Medio'),
  ('Anaïs Rodriguez Bastiani', 'Lunes Atletismo Medio'),
  ('Hugo Jiménez Ocaña', 'Lunes Atletismo Medio'),
  ('Celia Pereda Lostau', 'Lunes Atletismo Medio'),
  ('Isabel Simpson', 'Lunes Atletismo Medio'),
  ('Saul Tabasco Alonso', 'Lunes Atletismo Medio'),
  ('Daniel Bárez Carballo', 'Lunes Atletismo Medio'),
  ('ALICIA DELGADO PRIETO', 'Lunes Atletismo Medio'),
  ('Diego Gil  Gordillo', 'Lunes Atletismo Medio'),
  ('Martina Pous Ribagorda', 'Lunes Atletismo Medio'),
  ('Hugo Simon Perez', 'Lunes Atletismo Medio'),
  ('Fernando Niño Martínez', 'Lunes Atletismo Adultos'),
  ('Paloma Rojas Vaquero', 'Lunes Atletismo Adultos'),
  ('Elena Perez Ruiz', 'Lunes Atletismo Adultos'),
  ('David del Río Pascual', 'Lunes Atletismo Adultos'),
  ('Rosa Negreira Hernandez', 'Lunes Atletismo Adultos'),
  ('Lara de Diego Gustin', 'Lunes Atletismo Adultos'),
  ('Carolina Sánchez perez', 'Lunes Atletismo Adultos'),
  ('Luis Miguel Blázquez Iznaol', 'Lunes Atletismo Adultos'),
  ('Peter Simpson', 'Lunes Atletismo Adultos'),
  ('Hector Javier de la calle Gonzalez', 'Lunes Atletismo Adultos'),
  ('Paloma Canales Espi', 'Lunes Atletismo Adultos'),
  ('Sonia Andres Conde', 'Lunes Atletismo Adultos'),
  ('Daniel Puche Hontanilla', 'Lunes Atletismo Adultos'),
  ('Jaime Garrido Mariscal', 'Lunes Atletismo Adultos'),
  ('Sergio de la Camara Sanz', 'Lunes Atletismo Adultos'),
  ('Luis Cerrillo Arias', 'Lunes Atletismo Adultos'),
  ('ana Carmen Pozo Pascual', 'Lunes Atletismo Adultos'),
  ('Andreína Maris', 'Lunes Atletismo Adultos'),
  ('Miguel Ángel Pedrosa Hiruelas', 'Lunes Atletismo Adultos'),
  ('JAVIER CERDEIRA MELERO', 'Lunes Atletismo Adultos'),
  ('Nimai Pandit Delis Rojas', 'Lunes Atletismo Adultos'),
  ('Paula Holguín Segovia', 'Lunes Atletismo Adultos'),
  ('Daniel Castro Márquez', 'Lunes Atletismo Adultos'),
  ('Sandra Machado Henares', 'Lunes Atletismo Adultos'),
  ('Jaime González Marcos', 'Lunes Atletismo Adultos'),
  ('David Fernández Álvarez', 'Lunes Atletismo Adultos'),
  ('Alejandro Sanchez Martin', 'Lunes Atletismo Adultos'),
  ('Ramón Cabañas Giron', 'Lunes Atletismo Adultos')
),
grupos_norm as (
  select g.id as grupo_id,
    regexp_replace(unaccent(lower(trim(g.nombre))), '\s+', ' ', 'g') as clave
  from grupos g
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
)
insert into deportista_grupo (deportista_id, grupo_id)
select distinct t.id, gn.grupo_id
from roster_con_grupo rc
join todos t on unaccent(lower(t.nombre)) = unaccent(lower(rc.nombre))
join grupos_norm gn on gn.clave = rc.clave
on conflict do nothing;

-- Comprobación final
select g.nombre, count(dg.deportista_id) as num_deportistas
from grupos g
left join deportista_grupo dg on dg.grupo_id = g.id
where g.disciplina = 'carrera' and unaccent(lower(g.nombre)) like '%lunes%'
group by g.nombre
order by g.nombre;
