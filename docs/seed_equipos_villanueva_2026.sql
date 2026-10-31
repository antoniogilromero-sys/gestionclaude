-- Carga los dos equipos de la prueba 100x100 de natación de Villanueva de la
-- Cañada 2026, tal como se montaron en octubre de 2026. Ejecutar DESPUÉS de
-- docs/migracion_equipos_prueba.sql. Se puede ejecutar más de una vez: no
-- duplica nada.
--
-- Cada nadador se busca por nombre (sin acentos) y solo se vincula a su
-- ficha si hay UNA sola coincidencia entre los deportistas activos; si no,
-- se guarda solo con el nombre que se le puso (marcado "sin ficha" en el
-- resultado final) y se puede vincular a mano después. Armando GSD y Dani
-- GSD entran como nombre libre porque no tenemos su nombre completo.

insert into pruebas_equipos (nombre, fecha, lugar)
select '100x100 Villanueva de la Cañada 2026', null, 'Villanueva de la Cañada'
where not exists (
  select 1 from pruebas_equipos where nombre = '100x100 Villanueva de la Cañada 2026'
);

insert into prueba_equipo (prueba_id, nombre, orden)
select p.id, e.nombre, e.orden
from pruebas_equipos p
cross join (values ('Equipo 1', 1), ('Equipo 2', 2)) as e(nombre, orden)
where p.nombre = '100x100 Villanueva de la Cañada 2026'
  and not exists (
    select 1 from prueba_equipo x where x.prueba_id = p.id and x.nombre = e.nombre
  );

create temp table villanueva_miembros as
select * from (
  values
    ('Equipo 1',  1, 'Armando GSD',          null::text[]),
    ('Equipo 1',  2, 'Dani GSD',             null::text[]),
    ('Equipo 1',  3, 'Diego Gil',            array['diego','gil']),
    ('Equipo 1',  4, 'Dani Bárez',           array['dani','barez']),
    ('Equipo 1',  5, 'Julia Millo',          array['julia','millo']),
    ('Equipo 1',  6, 'Martina Pous',         array['martina','pous']),
    ('Equipo 1',  7, 'Antonio Gil',          array['antonio','gil']),
    ('Equipo 1',  8, 'Alicia Delgado',       array['alicia','delgado']),
    ('Equipo 1',  9, 'Carolina',             array['carolina','sanchez']),
    ('Equipo 1', 10, 'Hugo Martin',          array['hugo','martin']),
    ('Equipo 2',  1, 'Nimai',                array['nimai']),
    ('Equipo 2',  2, 'Jaime Contreras',      array['jaime','contreras']),
    ('Equipo 2',  3, 'Alejandro Sánchez',    array['alejandro','sanchez','martin']),
    ('Equipo 2',  4, 'Paula Holguín',        array['paula','holguin']),
    ('Equipo 2',  5, 'Sandra Machado',       array['sandra','machado']),
    ('Equipo 2',  6, 'Sonia Andres Conde',   array['sonia','andres','conde']),
    ('Equipo 2',  7, 'Paloma Rojas',         array['paloma','rojas']),
    ('Equipo 2',  8, 'Dani Puche',           array['dani','puche']),
    ('Equipo 2',  9, 'José Luis Plaza',      array['jose','luis','plaza']),
    ('Equipo 2', 10, 'Joseluis Martin',      array['jose','martin'])
) as v(equipo, orden, etiqueta, tokens);

create temp table villanueva_resueltos as
select m.equipo, m.orden, m.etiqueta,
       count(d.id) as n_fichas,
       min(d.id) as deportista_id,
       min(d.nombre) as nombre_ficha
from villanueva_miembros m
left join deportistas d
  on m.tokens is not null
 and d.activo
 and not exists (
   select 1 from unnest(m.tokens) as t(tok)
   where unaccent(lower(d.nombre)) !~ ('(^| )' || t.tok)
 )
group by m.equipo, m.orden, m.etiqueta;

insert into prueba_equipo_miembro (equipo_id, deportista_id, nombre, orden)
select e.id,
       case when r.n_fichas = 1 then r.deportista_id end,
       case when r.n_fichas = 1 then r.nombre_ficha else r.etiqueta end,
       r.orden
from villanueva_resueltos r
join prueba_equipo e on e.nombre = r.equipo
join pruebas_equipos p on p.id = e.prueba_id and p.nombre = '100x100 Villanueva de la Cañada 2026'
where not exists (
  select 1 from prueba_equipo_miembro x
  where x.equipo_id = e.id
    and x.nombre = case when r.n_fichas = 1 then r.nombre_ficha else r.etiqueta end
);

-- Resultado: quién se vinculó a su ficha y quién quedó "sin ficha" (nombre libre).
select r.equipo, r.orden, r.etiqueta,
       case when r.n_fichas = 1 then 'ficha: ' || r.nombre_ficha
            when r.n_fichas = 0 then 'sin ficha (nombre libre)'
            else 'sin ficha: hay ' || r.n_fichas || ' coincidencias' end as estado
from villanueva_resueltos r
order by r.equipo, r.orden;
