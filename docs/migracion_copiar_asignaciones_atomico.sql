-- =====================================================================
--  Copiar asignaciones de una semana a otra, de forma atómica
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Encontrado revisando la app entera (agosto 2026): "copiar semana
-- anterior" en /reparto borraba las asignaciones de la semana destino y
-- LUEGO insertaba las copiadas, en dos pasos sueltos desde el navegador.
-- Si el segundo paso fallaba (un corte de red, por ejemplo), la semana
-- destino se quedaba vacía sin ninguna manera automática de deshacerlo
-- — el mismo tipo de fallo que ya se evitó en `publicarSesion`
-- (crea un borrador y publica al final) pero que aquí se había colado.
--
-- Esta función hace el borrado y la inserción dentro de una sola
-- transacción de Postgres (el cuerpo de una función siempre es atómico):
-- si algo falla a mitad, no se llega a borrar nada. `setAsignacion` en
-- `src/app/reparto/actions.ts` pasa a llamar a esta función en vez de
-- hacer los dos pasos sueltos.

create or replace function copiar_asignaciones_semana(p_semana_destino date, p_semana_origen date)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_filas int;
begin
  if not es_director() then
    raise exception 'Solo el director puede hacer esto';
  end if;

  -- No hay nada que copiar: no tocamos la semana destino para no
  -- borrarla por error (mismo comportamiento que tenía antes).
  if not exists (select 1 from asignaciones where semana = p_semana_origen) then
    return 0;
  end if;

  delete from asignaciones where semana = p_semana_destino;

  insert into asignaciones (semana, grupo_id, entrenador_id)
  select p_semana_destino, grupo_id, entrenador_id
  from asignaciones
  where semana = p_semana_origen;

  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

grant execute on function copiar_asignaciones_semana(date, date) to authenticated;
