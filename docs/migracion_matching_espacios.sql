-- =====================================================================
--  Hacer que deportista_id_o_alta también ignore espacios de más
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Encontrado (agosto 2026): "Diego Gil Gordillo" se duplicó porque en
-- una de las hojas su nombre tenía un espacio doble entre "Gil" y
-- "Gordillo" ("Diego Gil  Gordillo"). `deportista_id_o_alta` ya
-- ignoraba acentos, mayúsculas y espacios al principio/final
-- (unaccent+lower+trim), pero NO los espacios de más en medio del
-- nombre — así que "Diego Gil Gordillo" y "Diego Gil  Gordillo" no se
-- reconocían como la misma persona y se creaba una ficha duplicada.
--
-- Se añade regexp_replace(..., '\s+', ' ', 'g') para colapsar
-- cualquier secuencia de espacios en uno solo antes de comparar — mismo
-- criterio que ya se usa en los scripts de sincronizar grupos. Sin
-- cambios de firma ni de dónde se usa (webhook de inscripciones y
-- sincronización completa la siguen llamando igual).

create or replace function deportista_id_o_alta(p_nombre text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_clave text;
begin
  v_clave := regexp_replace(unaccent(lower(trim(p_nombre))), '\s+', ' ', 'g');

  select id into v_id
  from deportistas
  where regexp_replace(unaccent(lower(trim(nombre))), '\s+', ' ', 'g') = v_clave
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
