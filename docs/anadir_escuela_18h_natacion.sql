-- =====================================================================
--  Añade dos grupos nuevos al horario de Escuela: natación de 18:00 a
--  19:00 los martes y los jueves en el Colegio GSD Guadarrama — se suman
--  a los de 19:00 a 20:00 que ya había, no los sustituyen.
--  Se puede ejecutar aunque ya se hubiera puesto el del martes: no
--  duplica nada.
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================

insert into horarios_entrenamiento (categoria, dia, disciplina, hora_inicio, hora_fin, lugar, notas)
select 'Escuela', d.dia, 'Natación', '18:00', '19:00', 'Colegio GSD Guadarrama', null
from (values ('martes'), ('jueves')) as d(dia)
where not exists (
  select 1 from horarios_entrenamiento h
  where h.categoria = 'Escuela' and h.dia = d.dia and h.disciplina = 'Natación'
    and h.hora_inicio = '18:00'
);

-- Comprobación: debe salir martes y jueves con dos franjas cada uno (18h y 19h)
select categoria, dia, disciplina, hora_inicio, hora_fin, lugar
from horarios_entrenamiento
where categoria = 'Escuela' and disciplina = 'Natación'
order by dia, hora_inicio;
