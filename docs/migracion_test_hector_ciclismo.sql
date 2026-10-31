-- Test Hector (ciclismo): 1 km 200 m (1.200 m) cronometrados. La marca es el
-- tiempo y gana el menor, como el 10 km y el 20 km bici CRI. No hay que
-- tocar código: los tests se construyen a partir de la tabla tipos_test.

insert into tipos_test (nombre, disciplina, distancia_m, metrica, mejor_es)
select 'Test Hector', 'ciclismo', 1200, 'tiempo', 'menor'
where not exists (select 1 from tipos_test where nombre = 'Test Hector');
