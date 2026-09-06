-- =====================================================================
--  Reparto: reorganizar y reordenar todos los grupos (temporada 26/27)
--  Pegar ENTERO en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Anton definio (septiembre 2026) el orden y la estructura que quiere ver
-- en /reparto. Este script:
--   1) Anade una columna `orden` a `grupos` para ordenarlos a mano
--      (hasta ahora /reparto los ordenaba por antiguedad del grupo).
--   2) Renombra los grupos de atletismo y de MTB para que se llamen por
--      nivel (Peques / Medio / Avanzado / Adultos).
--   3) Junta los dos grupos de peques de atletismo del lunes (1A + 1B) en
--      uno solo: mueve a los del 1B al 1A y oculta el 1B.
--   4) Crea el grupo nuevo "Martes Fuerza 19h".
--   5) Pone hora de inicio (09:00) al ciclismo de carretera del domingo.
--   6) Oculta los grupos viejos de natacion de la temporada pasada que
--      hayan quedado SIN nadie apuntado.
--   7) Fija el `orden` de cada grupo.
--
-- SOBRE COMO SE VE /reparto: la pantalla agrupa por deporte en secciones
-- (Carrera, Natacion, Fuerza, Ciclismo). Dentro de cada seccion los
-- grupos saldran en el orden que fijamos aqui. No se puede intercalar
-- "lunes atletismo -> martes natacion -> jueves atletismo" porque
-- atletismo y natacion son secciones distintas.
--
-- "Ocultar" = activo = false. NADA se borra: no se pierde el historico de
-- reparto ni de entrenamientos. Todo es reversible. Es seguro ejecutar
-- este script mas de una vez.

-- ---------------------------------------------------------------------
-- 0) FOTO DE ANTES (para comparar con el final)
-- ---------------------------------------------------------------------
select array_to_string(dias,'+') as dias, hora_inicio, hora_fin, disciplina,
       nombre, activo,
       (select count(*) from deportista_grupo dg where dg.grupo_id = g.id) as apuntados
from grupos g
order by activo desc, dias, hora_inicio nulls last, nombre;

-- ---------------------------------------------------------------------
-- 1) COLUMNA DE ORDEN
-- ---------------------------------------------------------------------
alter table grupos add column if not exists orden int not null default 1000;

-- ---------------------------------------------------------------------
-- 2) JUNTAR ATLETISMO PEQUES DEL LUNES (1A + 1B -> 1A)
-- ---------------------------------------------------------------------
insert into deportista_grupo (deportista_id, grupo_id)
select dg.deportista_id, (select id from grupos where nombre = 'Atletismo 1A Lunes')
from deportista_grupo dg
join grupos g on g.id = dg.grupo_id
where g.nombre = 'Atletismo 1B Lunes'
  and exists (select 1 from grupos where nombre = 'Atletismo 1A Lunes')
on conflict do nothing;

delete from deportista_grupo dg
using grupos g
where dg.grupo_id = g.id and g.nombre = 'Atletismo 1B Lunes';

update grupos set activo = false where nombre = 'Atletismo 1B Lunes';

-- ---------------------------------------------------------------------
-- 3) RENOMBRAR GRUPOS (y corregir horario del atletismo del lunes)
-- ---------------------------------------------------------------------
update grupos set nombre='Lunes Atletismo Peques',  hora_inicio='18:30', hora_fin='19:30' where nombre='Atletismo 1A Lunes';
update grupos set nombre='Lunes Atletismo Medio',   hora_inicio='18:30', hora_fin='19:30' where nombre='Atletismo 2 Lunes';
update grupos set nombre='Lunes Atletismo Adultos', hora_inicio='18:30', hora_fin='19:30' where nombre='Atletismo 3 Lunes';

update grupos set nombre='Jueves Atletismo Medio'    where nombre='Carrera Intermedio';
update grupos set nombre='Jueves Atletismo Avanzado' where nombre='Carrera Avanzado';

update grupos set nombre='Ciclismo MTB Peques' where nombre like 'Ciclismo MTB Iniciaci%';

update grupos set nombre='Jueves Peques 18h' where nombre='Jueves 18h';

-- ---------------------------------------------------------------------
-- 4) GRUPO NUEVO: MARTES FUERZA 19h
-- ---------------------------------------------------------------------
insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin)
select 'Martes Fuerza 19h', 'fuerza', '{martes}', '19:00', '20:00'
where not exists (select 1 from grupos where nombre = 'Martes Fuerza 19h');

-- ---------------------------------------------------------------------
-- 5) CICLISMO DE CARRETERA DEL DOMINGO: HORA 09:00
-- ---------------------------------------------------------------------
update grupos set hora_inicio='09:00'
where disciplina='ciclismo' and 'domingo' = any(dias) and nombre ilike '%carretera%';

-- ---------------------------------------------------------------------
-- 6) OCULTAR GRUPOS VIEJOS DE NATACION SIN NADIE APUNTADO
--    (Escuela jueves / Peques / Intermedio / Avanzado eran los nombres
--     de la temporada pasada, antes de los grupos por horario.)
--    Si alguno TIENE gente, no se toca y saldra en la foto final para
--    que Anton decida.
-- ---------------------------------------------------------------------
update grupos set activo = false
where nombre in ('Escuela jueves','Peques','Intermedio','Avanzado')
  and not exists (select 1 from deportista_grupo dg where dg.grupo_id = grupos.id);

-- ---------------------------------------------------------------------
-- 7) ORDEN DE CADA GRUPO
--    Carrera 10-60 | Natacion 100-210 | Fuerza 300 | Ciclismo 400-440
-- ---------------------------------------------------------------------
update grupos set orden = case nombre
  when 'Lunes Atletismo Peques'    then 10
  when 'Lunes Atletismo Medio'     then 20
  when 'Lunes Atletismo Adultos'   then 30
  when 'Jueves Atletismo Medio'    then 40
  when 'Jueves Atletismo Avanzado' then 50
  when 'Carrera Mayores'           then 60
  when 'Martes Peques 19h'         then 100
  when 'Martes Medio 19h'          then 110
  when 'Martes Avanzado 19h'       then 120
  when 'Martes Competicion 20h'    then 130
  when 'Jueves Peques 18h'         then 140
  when 'Jueves Peques 19h'         then 150
  when 'Jueves Medio 19h'          then 160
  when 'Jueves Avanzado 19h'       then 170
  when 'Jueves Bajo 20h'           then 180
  when 'Jueves Medio 20h'          then 190
  when 'Jueves Avanzado 20h'       then 200
  when 'Jueves Competicion 20h'    then 210
  when 'Martes Fuerza 19h'         then 300
  when 'Ciclismo MTB Peques'       then 400
  when 'Ciclismo MTB Medio'        then 410
  when 'Ciclismo MTB Avanzado'     then 420
  else orden
end;

-- Ciclismo de carretera (sabado y domingo): por patron, por si el nombre
-- exacto del grupo del sabado que creo Anton no es el esperado.
update grupos set orden = 430
  where disciplina='ciclismo' and 'sabado'  = any(dias) and nombre not ilike '%mtb%';
update grupos set orden = 440
  where disciplina='ciclismo' and 'domingo' = any(dias) and nombre not ilike '%mtb%';

-- ---------------------------------------------------------------------
-- 8) FOTO DEL RESULTADO (revisar que ha quedado como se queria)
-- ---------------------------------------------------------------------
select g.orden,
       array_to_string(g.dias,'+') as dias, g.hora_inicio, g.hora_fin,
       g.disciplina, g.nombre,
       (select count(*) from deportista_grupo dg where dg.grupo_id = g.id) as apuntados
from grupos g
where g.activo
order by g.orden, g.nombre;
