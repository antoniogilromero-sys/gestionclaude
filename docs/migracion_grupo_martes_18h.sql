-- Faltaba el grupo de natación de los martes de 18 a 19h. En la lista de 13
-- horarios que dio Antón solo estaba "Jueves 18h", no su equivalente del
-- martes. El reparto (/reparto) se construye a partir de la tabla `grupos`
-- (día + hora), así que basta con añadir la fila: no hay nada fijo en el
-- código que haya que tocar.

insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin)
select 'Martes 18h', 'natacion', '{martes}', '18:00', '19:00'
where not exists (select 1 from grupos where nombre = 'Martes 18h');
