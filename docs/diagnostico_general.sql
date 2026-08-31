-- =====================================================================
--  Diagnóstico general: inscripciones, deportistas y grupos
--  Solo lectura: no cambia nada, es para revisar lo que has actualizado.
-- =====================================================================

-- 1) Totales de cada tabla
select
  (select count(*) from inscripciones) as inscripciones_totales,
  (select count(*) from inscripciones where deportista_id is null) as inscripciones_sin_vincular,
  (select count(*) from deportistas) as deportistas_totales,
  (select count(*) from deportistas where activo) as deportistas_activos,
  (select count(*) from grupos where activo) as grupos_activos,
  (select count(*) from deportista_grupo) as vinculos_grupo_totales;

-- 2) Posibles duplicados en deportistas (mismo nombre sin acentos/mayúsculas/espacios)
select
  unaccent(lower(trim(nombre))) as nombre_normalizado,
  count(*) as veces,
  array_agg(id order by id) as ids,
  array_agg(nombre order by id) as nombres_tal_cual
from deportistas
group by 1
having count(*) > 1
order by 1;

-- 3) Nombres con texto corrompido (el problema de acentos de agosto)
select 'deportistas' as tabla, id, nombre from deportistas where nombre like '%Ã%'
union all
select 'inscripciones' as tabla, id, nombre_completo from inscripciones where nombre_completo like '%Ã%';

-- 4) Deportistas activos sin categoría o sin ningún grupo asignado
select d.id, d.nombre, d.categoria,
  (select count(*) from deportista_grupo dg where dg.deportista_id = d.id) as num_grupos
from deportistas d
where d.activo
  and (d.categoria is null or not exists (
    select 1 from deportista_grupo dg where dg.deportista_id = d.id
  ))
order by d.nombre;

-- 5) Grupos activos sin ningún deportista apuntado (por si alguno se quedó vacío)
select g.id, g.nombre, g.disciplina, g.dias, g.hora_inicio, g.hora_fin
from grupos g
where g.activo
  and not exists (select 1 from deportista_grupo dg where dg.grupo_id = g.id)
order by g.nombre;
