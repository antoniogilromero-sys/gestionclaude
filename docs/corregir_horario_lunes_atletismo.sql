-- =====================================================================
--  Corrige el horario de Atletismo de los lunes en /horarios: 18:30 a
--  19:30 (antes ponía 18:00 a 19:00), tanto en Adultos como en Escuela.
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

update horarios_entrenamiento
set hora_inicio = '18:30', hora_fin = '19:30'
where dia = 'lunes'
  and unaccent(lower(disciplina)) = 'atletismo';

-- Comprobación: deben salir dos filas (Adultos y Escuela) de 18:30 a 19:30
select categoria, dia, disciplina, hora_inicio, hora_fin, lugar
from horarios_entrenamiento
where dia = 'lunes' and unaccent(lower(disciplina)) = 'atletismo';
