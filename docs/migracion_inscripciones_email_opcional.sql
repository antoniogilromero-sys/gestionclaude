-- =====================================================================
--  El email deja de ser obligatorio en inscripciones: hay socios dados
--  de alta a mano en la hoja, sin haber pasado por el Google Forms, que
--  no tienen email registrado. Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

alter table inscripciones alter column email drop not null;
