-- =====================================================================
--  Que todos los entrenadores vean quien va a cada grupo en /reparto
--  Pegar ENTERO en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- La tabla `perfiles` solo la lee entera el director (politica
-- p_perfil_propio: cada uno ve su fila, el director ve todas). Por eso un
-- entrenador que entraba en /reparto no veia el nombre de los demas
-- entrenadores y TODOS los grupos le salian "Sin entrenador asignado".
--
-- En vez de abrir `perfiles` entera (tiene email y telefono), una funcion
-- `security definer` que devuelve SOLO id + nombre de los
-- entrenadores/directores activos. Mismo patron que `mejores_marcas` para
-- /rankings: abrir una rendija concreta sin tocar la RLS de la tabla.
--
-- Es seguro ejecutarlo mas de una vez.

create or replace function entrenadores_visibles()
returns table (id uuid, nombre text)
language sql
stable
security definer
set search_path = public
as $$
  select id, nombre
  from perfiles
  where activo and rol in ('director', 'entrenador')
  order by nombre;
$$;

revoke all on function entrenadores_visibles() from public;
grant execute on function entrenadores_visibles() to authenticated;

-- Comprobacion: debe listar a todo el equipo tecnico (director incluido).
select * from entrenadores_visibles();
