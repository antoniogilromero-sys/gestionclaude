-- =====================================================================
--  Abre la lectura de horarios_entrenamiento a cualquiera, sin login
--  Pegar en Supabase > SQL Editor > Run (una sola vez, después de haber
--  ejecutado ya migracion_horarios.sql).
--
--  Solo lectura (select) — dar de alta o borrar horarios sigue siendo
--  cosa exclusiva del director, esa política no se toca. No hay ningún
--  dato personal en esta tabla (solo día, disciplina, hora y lugar), así
--  que abrirla no rompe la norma de "sin datos personales" del proyecto.
-- =====================================================================

create policy p_horarios_leer_publico on horarios_entrenamiento
  for select to anon, authenticated
  using (true);
