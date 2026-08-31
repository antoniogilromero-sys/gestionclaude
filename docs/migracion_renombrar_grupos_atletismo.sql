-- =====================================================================
--  Reorganizar los grupos de Carrera del lunes en 4 grupos de Atletismo
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Antón pidió (agosto 2026) pasar de 3 grupos de Carrera el lunes
-- (Iniciación/Medio/Adultos) a 4 grupos de Atletismo, con 3 entrenadores
-- cubriéndolos en la misma franja horaria. Se RENOMBRAN las filas que ya
-- existían (en vez de borrarlas y crear otras nuevas) para no perder su
-- histórico de reparto y de entrenamientos publicados:
--   Carrera Iniciación → Atletismo 1A Lunes
--   Carrera Medio      → Atletismo 2 Lunes
--   Carrera Adultos    → Atletismo 3 Lunes
-- y se crea de cero el cuarto grupo, que no tenía equivalente:
--   Atletismo 1B Lunes
--
-- Los 3 grupos de Carrera del JUEVES (Intermedio/Avanzado/Mayores) NO se
-- tocan, siguen exactamente igual.
--
-- El horario real es 18:30-19:30, no 18:00-19:00 como tenían guardado
-- los 3 grupos viejos del lunes (Antón lo confirmó tras verlo en la
-- app) — se corrige aquí de paso para los 4.

update grupos set nombre = 'Atletismo 1A Lunes', hora_inicio = '18:30', hora_fin = '19:30'
  where nombre = 'Carrera Iniciación';
update grupos set nombre = 'Atletismo 2 Lunes', hora_inicio = '18:30', hora_fin = '19:30'
  where nombre = 'Carrera Medio';
update grupos set nombre = 'Atletismo 3 Lunes', hora_inicio = '18:30', hora_fin = '19:30'
  where nombre = 'Carrera Adultos';

insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin)
values ('Atletismo 1B Lunes', 'carrera', array['lunes'], '18:30', '19:30');

-- Comprueba que ha quedado bien: deberían salir los 4 grupos nuevos del
-- lunes con 18:30-19:30, más los 3 de Carrera del jueves sin tocar.
select id, nombre, disciplina, dias, hora_inicio, hora_fin, activo
from grupos
where disciplina = 'carrera'
order by dias, nombre;
