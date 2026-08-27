-- =====================================================================
--  Diagnóstico rápido de la tabla deportistas después de tocarla a mano
--  Solo lectura: no cambia nada, es para revisar.
-- =====================================================================

-- 1) Cuántos hay en total y cuántos activos
select count(*) as total, count(*) filter (where activo) as activos
from deportistas;

-- 2) Posibles duplicados (mismo nombre una vez quitados acentos/mayúsculas/espacios)
select
  unaccent(lower(trim(nombre))) as nombre_normalizado,
  count(*) as veces,
  array_agg(id order by id) as ids,
  array_agg(nombre order by id) as nombres_tal_cual
from deportistas
group by 1
having count(*) > 1
order by 1;

-- 3) Nombres con texto corrompido (el mismo problema de acentos de agosto)
select id, nombre from deportistas where nombre like '%Ã%';

-- 4) Recién llegados sin categoría o sin grupo asignado — normal si son
--    altas nuevas del formulario que aún no has terminado de rellenar,
--    pero échale un ojo por si se te olvidó alguno
select d.id, d.nombre, d.categoria,
  (select count(*) from deportista_grupo dg where dg.deportista_id = d.id) as num_grupos
from deportistas d
where d.activo
  and (d.categoria is null or not exists (
    select 1 from deportista_grupo dg where dg.deportista_id = d.id
  ))
order by d.nombre;
