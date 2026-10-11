-- =====================================================================
--  Resultados del club en el Duatlon Cros La Tribu Pinto (4 oct 2026)
--  Pegar en Supabase > SQL Editor > Run, DESPUES de migracion_avisos.sql.
-- =====================================================================
--
-- Fuente: clasificaciones oficiales de la Federacion Madrileña de
-- Triatlon (triatlonmadrid.org). Solo se cargan los deportistas del
-- club que terminaron. No terminaron (DNS): Alba Marfil Gomez (alevin)
-- y Hugo Jimenez Ocaña (alevin) — no se registran.
--
-- Se buscan por nombre sin acentos. El resultado final dice cuales no
-- tienen ficha en Deportistas (SIN FICHA): esos no se han cargado.
-- Se puede ejecutar mas de una vez: no duplica resultados ni avisos.
-- Los textos con acentos van escapados (U&'...') para que no se
-- corrompan al pegar.

create temp table pinto_resultados as
select * from (
  values
    -- Escolar
    ('celia pereda lostau',          U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:22:55.6', U&'4\00BA de 21 - Alev\00EDn femenino'),
    ('noa lopez herrera',            U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:25:03.0', U&'15\00BA de 21 - Alev\00EDn femenino'),
    ('martin arribas del amo',       U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:22:35.8', U&'12\00BA de 46 - Alev\00EDn masculino'),
    ('bruno pasamontes alarcon',     U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:26:40.6', U&'27\00BA de 46 - Alev\00EDn masculino'),
    ('luca fararoni bitar',          U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:27:10.6', U&'29\00BA de 46 - Alev\00EDn masculino'),
    ('jara lahera sanchez',          U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:41:22.0', U&'8\00BA de 15 - Infantil femenino'),
    ('alba garcia palacios',         U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:42:53.5', U&'10\00BA de 15 - Infantil femenino'),
    ('guillermo gonzalez serralta',  U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:36:08.0', U&'8\00BA de 39 - Infantil masculino'),
    ('saul tabasco alonso',          U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:39:45.7', U&'19\00BA de 39 - Infantil masculino'),
    ('irene ramirez martinez',       U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:37:48.5', U&'4\00BA de 19 - Cadete femenino'),
    ('anais rodriguez bastiani',     U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:48:47.1', U&'19\00BA de 19 - Cadete femenino'),
    ('daniel barez carballo',        U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:32:10.8', U&'11\00BA de 31 - Cadete masculino'),
    ('jaime contreras lopez',        U&'Duatl\00F3n Cros Escolar La Tribu Pinto', '0:33:39.9', U&'17\00BA de 31 - Cadete masculino'),
    -- Adultos (Campeonato de Madrid de Duatlon Cros)
    ('hector javier de la calle gonzalez', U&'Duatl\00F3n Cros La Tribu Pinto (Campeonato de Madrid)', '1:24:04', U&'21\00BA absoluta - 1\00BA de 5 en GE 55-59')
) as v(nombre, carrera, tiempo, clasificacion);

insert into competiciones (deportista_id, anio, nombre_carrera, fecha, disciplina, tiempo, clasificacion)
select d.id, 2026, r.carrera, date '2026-10-04', U&'Duatl\00F3n', r.tiempo, r.clasificacion
from pinto_resultados r
join deportistas d
  on regexp_replace(unaccent(lower(trim(d.nombre))), '\s+', ' ', 'g') = r.nombre
where not exists (
  select 1 from competiciones c
  where c.deportista_id = d.id
    and c.nombre_carrera = r.carrera
    and c.fecha = date '2026-10-04'
);

-- Aviso para el equipo (sale en Inicio durante 10 dias).
insert into avisos (titulo, texto, enlace)
select
  U&'Nuevos resultados: Duatl\00F3n Cros Pinto (4 oct)',
  U&'Se han subido los resultados de nuestros deportistas en el Duatl\00F3n Cros La Tribu Pinto, escolar y adultos. Mira Competiciones > Resultados.',
  '/competiciones'
where not exists (
  select 1 from avisos
  where titulo = U&'Nuevos resultados: Duatl\00F3n Cros Pinto (4 oct)'
);

-- Resultado: tienen que salir todos con estado "cargado".
select r.nombre, r.clasificacion,
  case when exists (
    select 1 from deportistas d
    where regexp_replace(unaccent(lower(trim(d.nombre))), '\s+', ' ', 'g') = r.nombre
  ) then 'cargado' else 'SIN FICHA' end as estado
from pinto_resultados r
order by estado desc, r.nombre;
