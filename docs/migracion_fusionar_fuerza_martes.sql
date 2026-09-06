-- =====================================================================
--  Fusionar los dos grupos de Fuerza del martes en uno
--  Pegar ENTERO en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Habia dos grupos iguales: "Martes Fuerza 19h" (lo creo
-- migracion_orden_grupos.sql) y "Fuerza Martes 19h" (creado a mano
-- antes). Se queda "Martes Fuerza 19h" (mismo estilo de nombre que
-- "Martes Peques 19h", etc.) y se le pasa TODO lo que tenga el otro:
-- deportistas apuntados, asignaciones de entrenadores y entrenamientos
-- publicados. Luego se oculta "Fuerza Martes 19h".
--
-- Si "Fuerza Martes 19h" no existe, este script no hace nada.
-- Es seguro ejecutarlo mas de una vez.

do $$
declare
  g_queda  bigint := (select id from grupos where nombre = 'Martes Fuerza 19h');
  g_va     bigint := (select id from grupos where nombre = 'Fuerza Martes 19h');
begin
  if g_va is null then
    raise notice 'No existe "Fuerza Martes 19h": nada que fusionar.';
    return;
  end if;

  -- por si acaso el grupo bueno no existe (no deberia): lo creamos
  if g_queda is null then
    insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin)
    values ('Martes Fuerza 19h', 'fuerza', '{martes}', '19:00', '20:00')
    returning id into g_queda;
  end if;

  insert into deportista_grupo (deportista_id, grupo_id)
  select deportista_id, g_queda from deportista_grupo
  where grupo_id = g_va
  on conflict do nothing;

  insert into asignaciones (semana, grupo_id, entrenador_id)
  select semana, g_queda, entrenador_id from asignaciones
  where grupo_id = g_va
  on conflict do nothing;

  insert into sesion_grupo (sesion_id, grupo_id)
  select sesion_id, g_queda from sesion_grupo
  where grupo_id = g_va
  on conflict do nothing;

  delete from deportista_grupo where grupo_id = g_va;
  delete from asignaciones      where grupo_id = g_va;
  delete from sesion_grupo      where grupo_id = g_va;

  update grupos set activo = false where id = g_va;
end $$;

-- --------------------------------------------------- COMPROBACION
-- Solo deberia quedar un grupo de fuerza activo: "Martes Fuerza 19h".
select nombre, array_to_string(dias,'+') as dias, hora_inicio, activo,
       (select count(*) from deportista_grupo dg where dg.grupo_id = g.id) as apuntados
from grupos g
where disciplina = 'fuerza'
order by activo desc, nombre;
