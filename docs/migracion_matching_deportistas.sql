-- =====================================================================
--  BUSCAR/CREAR DEPORTISTA POR NOMBRE + VINCULAR INSCRIPCIONES
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Motivo (agosto 2026): el alta automática de deportistas del webhook de
-- inscripciones (`/api/inscripciones/webhook`) comparaba nombres con
-- `.filter("nombre", "ilike", nombreCompleto)`, que sin comodines `%` es
-- una igualdad exacta salvo mayúsculas/minúsculas. Un espacio doble, un
-- acento distinto o un espacio al final del nombre (frecuente en datos
-- de formularios) hacía que no encontrara al deportista que ya existía
-- y creara uno duplicado. Esta función usa el mismo criterio
-- unaccent+lower+trim que ya se usa en el resto de cargas de este
-- proyecto, así que es mucho más difícil que falle por una tontería de
-- formato.
--
-- Además, el webhook nunca rellenaba `inscripciones.deportista_id`
-- (el campo que hace que en /inscripciones salga "Vinculada" en vez de
-- "Sin vincular") ni al crear el deportista ni al encontrar uno ya
-- existente — por eso todas las inscripciones, nuevas y viejas,
-- aparecían sin vincular aunque el deportista sí estuviera dado de alta.

create or replace function deportista_id_o_alta(p_nombre text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  select id into v_id
  from deportistas
  where unaccent(lower(trim(nombre))) = unaccent(lower(trim(p_nombre)))
  order by id
  limit 1;

  if v_id is null then
    insert into deportistas (nombre, activo)
    values (trim(p_nombre), true)
    returning id into v_id;
  end if;

  return v_id;
end;
$$;

grant execute on function deportista_id_o_alta(text) to service_role;

-- ---------------------------------------------------------------------
-- Backfill: vincula ahora mismo todas las inscripciones ya guardadas
-- (las históricas que se acaban de cargar y las que ya habían entrado
-- por el formulario en vivo) con su deportista, usando el mismo
-- criterio flexible. No toca las que ya estaban vinculadas ni crea
-- deportistas nuevos aquí — si no encuentra a nadie que coincida, la
-- deja "Sin vincular" tal cual estaba (revísala a mano en
-- /inscripciones, puede que el nombre del formulario y el de
-- Deportistas difieran demasiado, ej. mote vs nombre completo).
update inscripciones i
set deportista_id = d.id
from deportistas d
where i.deportista_id is null
  and unaccent(lower(trim(d.nombre))) = unaccent(lower(trim(i.nombre_completo)));

-- ---------------------------------------------------------------------
-- Diagnóstico de duplicados: deportistas cuyo nombre (sin acentos,
-- mayúsculas ni espacios de más) coincide con el de otro deportista.
-- Esto NO se fusiona solo — dos deportistas reales podrían coincidir en
-- nombre por casualidad. Revisa esta lista y, si son la misma persona,
-- dime cuáles y los fusiono (mover sus grupos/resultados/tests al que
-- se quede y dar de baja o borrar el duplicado).
select
  unaccent(lower(trim(nombre))) as nombre_normalizado,
  count(*) as veces,
  array_agg(id order by id) as ids,
  array_agg(nombre order by id) as nombres_tal_cual
from deportistas
group by 1
having count(*) > 1
order by 1;

-- Cuántas inscripciones quedan sin vincular después del backfill (para
-- comparar con las que había antes):
select count(*) as inscripciones_sin_vincular from inscripciones where deportista_id is null;
