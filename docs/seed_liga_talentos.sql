-- Carga completa de la Liga de Talentos (TOMADETIEMPOS2026CADETES.ods).
-- Requiere haber ejecutado antes docs/migracion_liga_talentos.sql.
-- Ejecutar una sola vez (no tiene protección contra duplicados).

-- 1) Deportistas que faltaban por dar de alta.
--    Aran e Irene ya no están en el club -> de baja desde ya.
--    Jesús seguía sin estar dado de alta en la app -> activo.
insert into deportistas (nombre, categoria, activo) values
  ('Aran Fernandez', 'Cadete', false),
  ('Irene Ramirez', 'Cadete', false),
  ('Jesús Egea Manjavacas', 'Cadete', true);

-- 2) Toma de tiempos (Natación 300m, Carrera 1600m). Alicia no tiene datos
--    en esta tabla en el Excel, así que no se inserta nada para ella aquí.
with claves(clave, patron1, patron2) as (
  values
    ('DANIEL', 'dani', 'barez'), ('JAIME', 'jaime', 'contreras'),
    ('ARAN', 'aran', 'fernandez'), ('JESUS', 'jes', 'egea'),
    ('MARIA', 'maria', 'caballero'), ('IRENE', 'irene', 'ramirez'),
    ('MARTINA', 'martina', 'pous'), ('JULIA', 'julia', 'millo')
),
resueltos as (
  select c.clave, d.id as deportista_id
  from claves c
  join deportistas d
    on unaccent(lower(d.nombre)) like '%' || unaccent(lower(c.patron1)) || '%'
   and unaccent(lower(d.nombre)) like '%' || unaccent(lower(c.patron2)) || '%'
)
insert into liga_talentos_marcas (deportista_id, prueba, tiempo_s)
select r.deportista_id, x.prueba, x.tiempo_s
from resueltos r
join (values
  ('DANIEL', 'Natación 300m', 245), ('DANIEL', 'Carrera 1600m', 335),
  ('JAIME',  'Natación 300m', 300), ('JAIME',  'Carrera 1600m', 344),
  ('ARAN',   'Natación 300m', 243), ('ARAN',   'Carrera 1600m', 330),
  ('JESUS',  'Natación 300m', 295), ('JESUS',  'Carrera 1600m', 318),
  ('MARIA',  'Natación 300m', 294), ('MARIA',  'Carrera 1600m', 386),
  ('IRENE',  'Natación 300m', 323), ('IRENE',  'Carrera 1600m', 380),
  ('MARTINA','Natación 300m', 258), ('MARTINA','Carrera 1600m', 386),
  ('JULIA',  'Natación 300m', 258), ('JULIA',  'Carrera 1600m', 386)
) as x(clave, prueba, tiempo_s) on x.clave = r.clave;

-- 3) Avilés Campeonato de España (duatlón). Tiempo total recalculado
--    sumando los tramos, no el texto de la celda (ver nota en la
--    migración). Sin fecha exacta -> se queda con el valor por defecto
--    (hoy); actualiza la columna fecha a mano si la sabes.
with claves(clave, patron1, patron2) as (
  values
    ('DANIEL', 'dani', 'barez'), ('JAIME', 'jaime', 'contreras'),
    ('ARAN', 'aran', 'fernandez'), ('JESUS', 'jes', 'egea'),
    ('ALICIA', 'alicia', 'prieto'), ('MARIA', 'maria', 'caballero'),
    ('IRENE', 'irene', 'ramirez'), ('MARTINA', 'martina', 'pous'),
    ('JULIA', 'julia', 'millo')
),
resueltos as (
  select c.clave, d.id as deportista_id
  from claves c
  join deportistas d
    on unaccent(lower(d.nombre)) like '%' || unaccent(lower(c.patron1)) || '%'
   and unaccent(lower(d.nombre)) like '%' || unaccent(lower(c.patron2)) || '%'
)
insert into liga_talentos_carreras (deportista_id, carrera, carrera_s, t1_s, bici_s, t2_s, correr_s, total_s)
select r.deportista_id, x.carrera, x.carrera_s, x.t1_s, x.bici_s, x.t2_s, x.correr_s, x.total_s
from resueltos r
join (values
  ('ARAN',    'Avilés Campeonato de España', 542::numeric, 96::numeric,  977::numeric, null::numeric, 423::numeric, 2038::numeric),
  ('JESUS',   'Avilés Campeonato de España', 592, 108, 969, 116, 355, 2140),
  ('DANIEL',  'Avilés Campeonato de España', 587, 101, 1029, 100, 366, 2183),
  ('JAIME',   'Avilés Campeonato de España', 608, 117, 995, 112, 363, 2195),
  ('ALICIA',  'Avilés Campeonato de España', 805, 161, 1194, 164, 520, 2844),
  ('IRENE',   'Avilés Campeonato de España', 661, 115, 1150, 126, 395, 2447),
  ('JULIA',   'Avilés Campeonato de España', 693, 120, 1095, 122, 410, 2440),
  ('MARTINA', 'Avilés Campeonato de España', 705, 124, 1053, 115, 415, 2412),
  ('MARIA',   'Avilés Campeonato de España', 703, 129, 1200, 117, 428, 2577),
  ('ARAN',    'Avilés Campeonato de España (Final B)', 557, 63, 937, 106, 344, 2007)
) as x(clave, carrera, carrera_s, t1_s, bici_s, t2_s, correr_s, total_s) on x.clave = r.clave;

-- Referencia externa (no es de nuestro club, pero estaba en la hoja como
-- comparación del campeón cadete nacional):
insert into liga_talentos_carreras (equipo, carrera, carrera_s, t1_s, bici_s, t2_s, correr_s, total_s)
values ('Jeydes (campeón cadete nacional)', 'Avilés Campeonato de España', 549, 86, 804, 87, 324, 1850);

-- 4) Relevo Parejas Mixtos.
with claves(clave, patron1, patron2) as (
  values
    ('ARAN', 'aran', 'fernandez'), ('JESUS', 'jes', 'egea'),
    ('MARTINA', 'martina', 'pous'), ('JULIA', 'julia', 'millo')
),
resueltos as (
  select c.clave, d.id as deportista_id
  from claves c
  join deportistas d
    on unaccent(lower(d.nombre)) like '%' || unaccent(lower(c.patron1)) || '%'
   and unaccent(lower(d.nombre)) like '%' || unaccent(lower(c.patron2)) || '%'
)
insert into liga_talentos_carreras (deportista_id, carrera, carrera_s, t1_s, bici_s, t2_s, correr_s, total_s)
select r.deportista_id, x.carrera, x.carrera_s, x.t1_s, x.bici_s, x.t2_s, x.correr_s, x.total_s
from resueltos r
join (values
  ('ARAN',    'Relevo Parejas Mixtos', 426::numeric, 108::numeric, 684::numeric, 102::numeric, 262::numeric, 1582::numeric),
  ('JESUS',   'Relevo Parejas Mixtos', 435, 118, 689, 124, 259, 1625),
  ('JULIA',   'Relevo Parejas Mixtos', 529, 136, 784, 136, 311, 1896),
  ('MARTINA', 'Relevo Parejas Mixtos', 519, 133, 753, 131, 314, 1850)
) as x(clave, carrera, carrera_s, t1_s, bici_s, t2_s, correr_s, total_s) on x.clave = r.clave;

insert into liga_talentos_carreras (equipo, carrera, carrera_s, t1_s, bici_s, t2_s, correr_s, total_s)
values
  ('Tribarri Villafranca 1', 'Relevo Parejas Mixtos', 454, 109, 660, 115, 268, 1606),
  ('Tribarri Villafranca 2', 'Relevo Parejas Mixtos', 373, 91, 583, 94, 239, 1380);

-- 5) Comprueba que todo entró: 8 filas en marcas × 2 pruebas = 16, y
-- 11 + 2 = 13 filas en carreras.
select 'marcas' as tabla, count(*) from liga_talentos_marcas
union all
select 'carreras', count(*) from liga_talentos_carreras;
