-- =====================================================================
--  Añade el contacto del colegio a jornadas_colegios
--  Pegar en Supabase > SQL Editor > Run (una sola vez, después de haber
--  ejecutado ya migracion_jornadas_colegios.sql).
-- =====================================================================

alter table jornadas_colegios add column if not exists contacto text;
