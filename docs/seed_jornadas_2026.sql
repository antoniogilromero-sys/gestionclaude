-- =====================================================================
--  Jornadas de promoción 2026 (capturadas de tu Excel)
--  Pegar en Supabase > SQL Editor > Run — UNA SOLA VEZ. A diferencia de
--  seed_deportistas.sql, aquí no hay una columna única (como el "ref" de
--  los deportistas) que evite duplicados: si lo ejecutas dos veces,
--  tendrás las 4 jornadas repetidas. Si eso pasa, bórralas desde la
--  propia app (/jornadas, botón "Borrar").
--
--  El taller de Alfonso XXII se marca como "Triatlón" y no "Duatlón"
--  porque así lo describe tu Excel ("taller de triatlon"); los otros
--  tres sí son de duatlón.
--
--  IES Alpedrete lleva a Nimai y Laura enlazados como entrenadores.
--  Ese enlace solo se crea si ya se han registrado alguna vez en la app
--  (necesitan tener fila en `perfiles`); si todavía no lo han hecho, la
--  jornada se crea igual pero sin entrenadores asignados — entra luego
--  en /jornadas y edítala a mano cuando se hayan registrado.
-- =====================================================================

with nueva as (
  insert into jornadas_colegios (anio, colegio, fecha_horario, disciplina, contacto)
  values (
    2026,
    'IES Alpedrete',
    '11 de marzo (miércoles) y 13 de marzo (viernes), de 9 a 11h (llegada 8:15h)',
    'Duatlón',
    'Carmen'
  )
  returning id
)
insert into jornada_entrenador (jornada_id, entrenador_id)
select nueva.id, perfiles.id
from nueva, perfiles
where perfiles.nombre in ('Nimai', 'Laura');

insert into jornadas_colegios (anio, colegio, fecha_horario, disciplina, contacto) values
  (2026, 'Colegio Alfonso XXII', '9 de junio, de 11:30 a 13:30 — taller de triatlón', 'Triatlón', 'Cristina'),
  (2026, 'Colegio Los Molinos', '8 de junio, de 9 a 13h (de 1 a 4)', 'Duatlón', 'Por email'),
  (2026, 'El Enebral Villalba', '29 de abril', 'Duatlón', null);
