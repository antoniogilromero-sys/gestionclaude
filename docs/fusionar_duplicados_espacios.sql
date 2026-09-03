-- =====================================================================
--  Fusiona automáticamente TODOS los duplicados por espacios de más
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Ahora que deportista_id_o_alta ignora espacios de más (ver
-- docs/migracion_matching_espacios.sql, ejecútalo antes que este si
-- todavía no lo has hecho), esta pasada busca en TODA la tabla
-- deportistas a quien coincida con ese mismo criterio (sin acentos,
-- mayúsculas, ni espacios de más colapsados) y fusiona cada grupo en el
-- de id más bajo — el mismo caso de Diego Gil Gordillo, pero revisando
-- a todo el mundo de una vez en vez de uno a uno.
--
-- Es un cambio seguro de fusionar automáticamente (a diferencia del
-- emparejamiento por apodos): dos nombres que solo difieren en espacios
-- son, letra por letra, la misma persona — no hay ambigüedad como sí la
-- había con nombres parecidos pero distintos.

do $$
declare
  r record;
  i int;
begin
  for r in
    select array_agg(id order by id) as ids
    from deportistas
    group by regexp_replace(unaccent(lower(trim(nombre))), '\s+', ' ', 'g')
    having count(*) > 1
  loop
    for i in 2..array_length(r.ids, 1) loop
      if exists (select 1 from deportistas where id = r.ids[1])
         and exists (select 1 from deportistas where id = r.ids[i]) then
        perform fusionar_deportistas(r.ids[1], r.ids[i]);
      end if;
    end loop;
  end loop;
end $$;

-- Comprobación: no debería quedar ningún grupo con más de una fila
select
  regexp_replace(unaccent(lower(trim(nombre))), '\s+', ' ', 'g') as nombre_normalizado,
  count(*) as veces,
  array_agg(nombre order by id) as nombres_tal_cual
from deportistas
group by 1
having count(*) > 1
order by 1;

select count(*) as deportistas_totales from deportistas;
