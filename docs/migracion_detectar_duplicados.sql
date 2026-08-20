-- =====================================================================
--  DETECTAR Y FUSIONAR DEPORTISTAS DUPLICADOS
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Motivo (agosto 2026): al vincular las inscripciones sin pareja
-- (`update inscripciones set deportista_id = deportista_id_o_alta(...)`)
-- se crearon deportistas nuevos para cualquier nombre que no coincidiera
-- EXACTAMENTE (sin acentos/mayúsculas/espacios de más) con uno ya
-- existente. Eso no detecta motes ni nombres abreviados: "Dani Barez"
-- del formulario y "Daniel Bárez Carballo" que ya estaba en Deportistas
-- son la misma persona pero con la comparación exacta no hacían match,
-- así que "Dani Barez" se creó como deportista nuevo y duplicado.
--
-- `nombres_parecidos` compara nombre por palabra (ignorando "de/la/del"
-- y palabras de menos de 3 letras): cada palabra del nombre más corto
-- tiene que ser el principio de alguna palabra del nombre más largo.
-- Así "Dani" encaja como principio de "Daniel" y "Barez" encaja con
-- "Bárez" (una vez sin acentos) — pero "Ana García" no hace match falso
-- con "Ana Gómez", porque el apellido no cuadra.

create or replace function nombres_parecidos(nombre1 text, nombre2 text)
returns boolean
language plpgsql
stable
as $$
declare
  palabras_cortas text[];
  palabras_largas text[];
  palabra text;
begin
  if length(nombre1) <= length(nombre2) then
    palabras_cortas := string_to_array(unaccent(lower(trim(nombre1))), ' ');
    palabras_largas := string_to_array(unaccent(lower(trim(nombre2))), ' ');
  else
    palabras_cortas := string_to_array(unaccent(lower(trim(nombre2))), ' ');
    palabras_largas := string_to_array(unaccent(lower(trim(nombre1))), ' ');
  end if;

  foreach palabra in array palabras_cortas loop
    if length(palabra) < 3 then
      continue;
    end if;
    if not exists (
      select 1 from unnest(palabras_largas) l
      where l like palabra || '%'
    ) then
      return false;
    end if;
  end loop;

  return true;
end;
$$;

-- Junta todo lo de un deportista duplicado (p_duplicado) en el que se
-- queda (p_mantener) y borra al duplicado. Tablas con una restricción de
-- "una fila por deportista" (grupo, resultado del mismo test el mismo
-- día, conexión de Strava): si el que se queda ya tiene esa fila, se
-- descarta la del duplicado en vez de fallar a mitad de la fusión.
create or replace function fusionar_deportistas(p_mantener bigint, p_duplicado bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_mantener = p_duplicado then
    raise exception 'mantener y duplicado no pueden ser el mismo id';
  end if;

  update deportista_grupo dg set deportista_id = p_mantener
   where deportista_id = p_duplicado
     and not exists (
       select 1 from deportista_grupo dg2
       where dg2.deportista_id = p_mantener and dg2.grupo_id = dg.grupo_id
     );
  delete from deportista_grupo where deportista_id = p_duplicado;

  update resultados r set deportista_id = p_mantener
   where deportista_id = p_duplicado
     and not exists (
       select 1 from resultados r2
       where r2.deportista_id = p_mantener
         and r2.tipo_test_id = r.tipo_test_id
         and r2.fecha = r.fecha
     );
  delete from resultados where deportista_id = p_duplicado;

  update strava_conexiones set deportista_id = p_mantener
   where deportista_id = p_duplicado
     and not exists (select 1 from strava_conexiones where deportista_id = p_mantener);
  delete from strava_conexiones where deportista_id = p_duplicado;

  -- Sin restricción de unicidad: se mueven todas las filas sin más.
  update competiciones set deportista_id = p_mantener where deportista_id = p_duplicado;
  update liga_talentos_marcas set deportista_id = p_mantener where deportista_id = p_duplicado;
  update liga_talentos_carreras set deportista_id = p_mantener where deportista_id = p_duplicado;
  update strava_actividades set deportista_id = p_mantener where deportista_id = p_duplicado;
  update pedidos set deportista_id = p_mantener where deportista_id = p_duplicado;
  update strava_rpe set deportista_id = p_mantener where deportista_id = p_duplicado;
  update inscripciones set deportista_id = p_mantener where deportista_id = p_duplicado;

  delete from deportistas where id = p_duplicado;
end;
$$;

grant execute on function fusionar_deportistas(bigint, bigint) to authenticated;

-- ---------------------------------------------------------------------
-- Candidatos a duplicado: parejas de deportistas cuyo nombre "encaja"
-- por palabras. Revisa la columna nombre_a/nombre_b de cada fila — si de
-- verdad son la misma persona, copia y ejecuta el contenido de
-- sql_para_fusionar (deja al de id más bajo, que normalmente es el que
-- ya tenía grupos/tests/históricos, y absorbe en él al más nuevo). Si
-- son dos personas distintas que comparten nombre por casualidad, no
-- ejecutes esa línea.
select
  a.id as id_a, a.nombre as nombre_a,
  b.id as id_b, b.nombre as nombre_b,
  format('select fusionar_deportistas(%s, %s);', least(a.id, b.id), greatest(a.id, b.id)) as sql_para_fusionar
from deportistas a
join deportistas b on a.id < b.id
where nombres_parecidos(a.nombre, b.nombre)
order by a.nombre;
