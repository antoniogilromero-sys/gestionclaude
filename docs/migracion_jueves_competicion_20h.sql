-- =====================================================================
--  Jueves 20:00 = solo "Jueves Competicion 20h"
--  Pegar ENTERO en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Anton decidio (septiembre 2026) que el jueves a las 20h quede igual que
-- el martes: un unico grupo de natacion, "Jueves Competicion 20h". Se
-- ocultan (activo = false, NO se borran) los otros tres:
--   - Jueves Bajo 20h
--   - Jueves Medio 20h
--   - Jueves Avanzado 20h
-- y sus nadadores pasan todos a "Jueves Competicion 20h".
--
-- (En la migracion anterior estos tres se habian dejado a proposito;
--  esto lo revierte. El martes ya estaba asi desde
--  migracion_adultos_competicion_20h.sql.)
--
-- Es seguro ejecutar este script mas de una vez.

-- 1) Mover nadadores a "Jueves Competicion 20h"
insert into deportista_grupo (deportista_id, grupo_id)
select distinct dg.deportista_id,
       (select id from grupos where nombre = 'Jueves Competicion 20h')
from deportista_grupo dg
join grupos g on g.id = dg.grupo_id
where g.nombre in ('Jueves Bajo 20h', 'Jueves Medio 20h', 'Jueves Avanzado 20h')
on conflict do nothing;

-- 2) Quitar su vinculo con los tres grupos que se van
delete from deportista_grupo dg
using grupos g
where dg.grupo_id = g.id
  and g.nombre in ('Jueves Bajo 20h', 'Jueves Medio 20h', 'Jueves Avanzado 20h');

-- 3) Ocultar los tres grupos
update grupos set activo = false
where nombre in ('Jueves Bajo 20h', 'Jueves Medio 20h', 'Jueves Avanzado 20h');

-- --------------------------------------------------- COMPROBACION
-- A las 20:00 solo deberian quedar activos "Martes Competicion 20h" y
-- "Jueves Competicion 20h".
select nombre, array_to_string(dias,'+') as dias, hora_inicio, activo,
       (select count(*) from deportista_grupo dg where dg.grupo_id = g.id) as apuntados
from grupos g
where hora_inicio = '20:00'
order by activo desc, dias, nombre;
