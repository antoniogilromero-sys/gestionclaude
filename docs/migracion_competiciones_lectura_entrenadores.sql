-- =====================================================================
--  COMPETICIONES: LECTURA TAMBIEN PARA ENTRENADORES
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Antón pidió que los entrenadores puedan ver (no crear ni borrar) los
-- resultados de competiciones desde una pantalla nueva, /competiciones.
-- Hasta ahora la tabla `competiciones` era de lectura solo para el
-- director (docs/migracion_competiciones.sql). Se amplía SOLO el select;
-- crear y borrar competiciones sigue siendo cosa exclusiva del director
-- (esas políticas y el guard en las server actions no cambian).
drop policy if exists p_competiciones_leer on competiciones;
create policy p_competiciones_leer on competiciones for select using (aprobado());
