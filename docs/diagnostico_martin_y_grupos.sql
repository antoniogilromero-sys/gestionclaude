-- Solo lectura, para revisar dos cosas a la vez.

-- 1) ¿Existe Martín Arribas del Amo? ¿En qué grupos está?
select d.id, d.nombre, d.activo,
  (select string_agg(g.nombre, ', ') from deportista_grupo dg join grupos g on g.id = dg.grupo_id where dg.deportista_id = d.id) as grupos
from deportistas d
where unaccent(lower(d.nombre)) like '%martin%arribas%'
   or unaccent(lower(d.nombre)) like '%arribas%amo%';

-- 2) ¿Está su inscripción cargada y vinculada?
select id, nombre_completo, email, email2, telefono, deportista_id
from inscripciones
where unaccent(lower(nombre_completo)) like '%arribas%amo%';

-- 3) Todos los grupos que hay ahora mismo (para ver los nombres reales
--    de carrera/atletismo, que en tu captura salían distintos a los que
--    yo tenía apuntados)
select id, nombre, disciplina, dias, hora_inicio, hora_fin, activo
from grupos
order by disciplina, dias, nombre;
