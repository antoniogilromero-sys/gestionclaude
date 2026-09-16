-- =====================================================================
--  Añade un grupo nuevo al horario de Escuela: natación de 18:00 a 19:00
--  los martes en el Colegio Gredos San Diego (Guadarrama) — se suma al
--  que ya había de 19:00 a 20:00, no lo sustituye.
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

insert into horarios_entrenamiento (categoria, dia, disciplina, hora_inicio, hora_fin, lugar, notas)
select 'Escuela', 'martes', 'Natación', '18:00', '19:00', 'Colegio GSD Guadarrama', null
where not exists (
  select 1 from horarios_entrenamiento
  where categoria = 'Escuela' and dia = 'martes' and disciplina = 'Natación'
    and hora_inicio = '18:00'
);

-- Comprobación: debe salir Escuela + martes + Natación dos veces (18h y 19h)
select categoria, dia, disciplina, hora_inicio, hora_fin, lugar
from horarios_entrenamiento
where categoria = 'Escuela' and dia = 'martes' and disciplina = 'Natación'
order by hora_inicio;
