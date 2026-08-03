-- =====================================================================
--  Añade email2 y tarifa a inscripciones (campos del formulario que
--  faltaban). Pegar en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================

alter table inscripciones add column if not exists email2 text;
alter table inscripciones add column if not exists tarifa text;
