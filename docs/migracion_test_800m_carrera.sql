-- =====================================================================
--  Añade el test "800 m carrera" (faltaba — en natación ya existía el
--  800m, pero en atletismo no había pestaña para esa distancia).
--  Pegar entero en Supabase > SQL Editor > Run.
-- =====================================================================

insert into tipos_test (nombre, disciplina, distancia_m, metrica, mejor_es)
values ('800 m carrera', 'carrera', 800, 'tiempo', 'menor')
on conflict (nombre) do nothing;

-- Comprobación: debe aparecer junto al resto de tests de carrera.
select id, nombre, disciplina, distancia_m
from tipos_test
where disciplina = 'carrera'
order by distancia_m nulls last;
