-- Test de 25 m de natación (para los más pequeños, que aún no hacen 50 m).
-- Mismo formato que el resto del catálogo: la marca es el tiempo y gana el
-- menor. No hay que tocar código: los tests, los rankings y el análisis se
-- construyen a partir de la tabla tipos_test.

insert into tipos_test (nombre, disciplina, distancia_m, metrica, mejor_es)
select '25 m natacion', 'natacion', 25, 'tiempo', 'menor'
where not exists (select 1 from tipos_test where nombre = '25 m natacion');
