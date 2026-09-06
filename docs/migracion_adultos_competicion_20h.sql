-- =====================================================================
--  Reparto: un unico grupo "Adultos Competicion" a las 20:00 el martes
--  y otro el jueves, en vez de los 3 niveles del martes a esa hora
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Anton pidio (septiembre 2026): en el reparto semanal (/reparto), a las
-- 20:00 de los ADULTOS tiene que haber un solo grupo el martes
-- ("Martes Competicion 20h") y otro el jueves ("Jueves Competicion 20h").
--
-- Se QUITAN de la vista los 3 grupos de adultos del MARTES a las 20h:
--   - Martes Bajo 20h
--   - Martes Medio 20h
--   - Martes Avanzado 20h
-- y tambien el grupo antiguo "Adultos competicion" (temporada pasada,
-- del schema.sql original).
--
-- "Quitar" aqui = marcar activo = false, NO borrar la fila. Asi
-- desaparecen del reparto, de /grupos y de /deportistas (todas esas
-- pantallas piden solo grupos con activo = true) pero NO se pierde el
-- historico de reparto ya guardado de semanas anteriores. Mismo criterio
-- que se uso al reorganizar los grupos de atletismo. Si algun dia
-- quieres borrarlas del todo, es un paso aparte.
--
-- Los 3 grupos del JUEVES a las 20h (Jueves Bajo/Medio/Avanzado 20h) NO
-- se tocan: Anton confirmo que el jueves 20h se queda con esos 3 mas el
-- nuevo "Jueves Competicion 20h".
--
-- Es seguro ejecutar esto mas de una vez: no duplica grupos ni vinculos.

-- --------------------------------------------------- 1) GRUPOS NUEVOS
insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin)
select v.nombre, 'natacion', v.dias, '20:00'::time, '21:00'::time
from (values
  ('Martes Competicion 20h', '{martes}'::text[]),
  ('Jueves Competicion 20h', '{jueves}'::text[])
) as v(nombre, dias)
where not exists (select 1 from grupos g where g.nombre = v.nombre);

-- ------------------------------- 2) MOVER NADADORES DEL MARTES 20h
-- Todo el que este apuntado a Martes Bajo/Medio/Avanzado 20h queda
-- apuntado a "Martes Competicion 20h".
insert into deportista_grupo (deportista_id, grupo_id)
select distinct dg.deportista_id,
       (select id from grupos where nombre = 'Martes Competicion 20h')
from deportista_grupo dg
join grupos g on g.id = dg.grupo_id
where g.nombre in ('Martes Bajo 20h', 'Martes Medio 20h', 'Martes Avanzado 20h')
on conflict do nothing;

-- Y se quita su vinculo con los 3 grupos viejos (esos grupos se van).
delete from deportista_grupo dg
using grupos g
where dg.grupo_id = g.id
  and g.nombre in ('Martes Bajo 20h', 'Martes Medio 20h', 'Martes Avanzado 20h');

-- ------------------------------------------- 3) OCULTAR LOS VIEJOS
update grupos
set activo = false
where nombre in ('Martes Bajo 20h', 'Martes Medio 20h', 'Martes Avanzado 20h')
   or unaccent(lower(nombre)) = 'adultos competicion';

-- --------------------------------------------------- COMPROBACION
-- Deberian salir SOLO estos grupos de natacion a las 20:00 activos:
--   Martes Competicion 20h   {martes}
--   Jueves Competicion 20h   {jueves}
--   Jueves Bajo 20h          {jueves}
--   Jueves Medio 20h         {jueves}
--   Jueves Avanzado 20h      {jueves}
select nombre, dias, hora_inicio, hora_fin, activo
from grupos
where disciplina = 'natacion' and hora_inicio = '20:00'
order by activo desc, dias, nombre;

-- Cuantos nadadores han quedado en el grupo nuevo del martes:
select g.nombre, count(dg.deportista_id) as num_nadadores
from grupos g
left join deportista_grupo dg on dg.grupo_id = g.id
where g.nombre in ('Martes Competicion 20h', 'Jueves Competicion 20h')
group by g.nombre
order by g.nombre;
