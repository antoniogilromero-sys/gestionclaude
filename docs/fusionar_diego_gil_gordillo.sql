-- =====================================================================
--  Fusiona automáticamente los duplicados de "Diego Gil Gordillo"
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Busca todas las fichas cuyo nombre encaje con "Diego Gil Gordillo"
-- (ignorando espacios de más, acentos y mayúsculas) y las fusiona todas
-- en la de id más bajo, usando fusionar_deportistas (ya creada en este
-- proyecto) — mueve grupos, tests, Strava y todo lo demás sin perderlo,
-- da igual cuál de las fichas tuviera el Strava conectado.

do $$
declare
  ids bigint[];
  mantener bigint;
  i int;
begin
  select array_agg(id order by id) into ids
  from deportistas
  where regexp_replace(unaccent(lower(trim(nombre))), '\s+', ' ', 'g') = 'diego gil gordillo';

  if ids is null or array_length(ids, 1) < 2 then
    raise notice 'No se han encontrado duplicados de Diego Gil Gordillo (o solo hay uno).';
    return;
  end if;

  mantener := ids[1];
  for i in 2..array_length(ids, 1) loop
    perform fusionar_deportistas(mantener, ids[i]);
  end loop;

  raise notice 'Fusionado en el id %', mantener;
end $$;

-- Comprobación final
select id, nombre, activo,
  exists(select 1 from strava_conexiones sc where sc.deportista_id = d.id) as tiene_strava
from deportistas d
where unaccent(lower(d.nombre)) like '%diego%gil%gordillo%';
