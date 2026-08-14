-- Carga inicial del calendario de próximas competiciones (temporada
-- agosto-noviembre 2026), a partir de la lista que dio Antón + el
-- Circuito Escolar 2026 de triatlonmadrid.org. Requiere haber ejecutado
-- antes docs/migracion_proximas_competiciones.sql.

insert into proximas_competiciones (nombre, fecha, lugar, disciplina, notas) values
  ('Travesía de Los Ángeles de San Rafael', '2026-08-15', 'Los Ángeles de San Rafael', 'Natación', null),
  ('Half Emede Valladolid', '2026-08-22', 'Valladolid', 'Triatlón', 'Va Juanma'),
  ('Carrera Pedestre de Cerceda', '2026-08-27', 'Cerceda', 'Carrera', null),
  ('Triatlón de Pálmaces', '2026-09-05', 'Pálmaces de Jadraque', 'Triatlón', null),
  ('Campeonato de Madrid Duatlón Media Distancia', '2026-09-06', 'Madrid', 'Duatlón', null),
  ('SwimRun Madrid', '2026-09-20', 'Madrid', 'SwimRun', null),
  ('Triatlón de Madrid (Sprint / Olímpico)', '2026-09-26', 'Madrid', 'Triatlón', '26 y 27 de septiembre'),
  ('Triatlón de Madrid (Short)', '2026-09-26', 'Madrid', 'Triatlón', '26 y 27 de septiembre'),
  ('Campeonato del Mundo de Triatlón (Pontevedra)', '2026-09-26', 'Pontevedra', 'Triatlón', '26 y 27 de septiembre'),
  ('Media maratón de Valladolid', '2026-09-27', 'Valladolid', 'Carrera', null),
  ('Duatlón Escolar Huno Cubas de la Sagra', '2026-09-26', 'Cubas de la Sagra', 'Duatlón', 'Circuito Escolar'),
  ('Campeonato de Madrid de Duatlón Cros Cadete (La Tribu)', '2026-10-04', 'Pinto', 'Duatlón', 'Duatlón Cros Escolar La Tribu · Circuito Escolar'),
  ('Hyatlón en Madrid - FETRI', '2026-10-10', 'Madrid', 'Otro', '10 y 11 de octubre'),
  ('Duatlón Cros Trikatlón Tres Cantos', '2026-10-18', 'Tres Cantos', 'Duatlón', 'Circuito Escolar'),
  ('Short y Half de Gandía', '2026-10-17', 'Gandía', 'Triatlón', null),
  ('10 km Bilbao', '2026-10-17', 'Bilbao', 'Carrera', null),
  ('Half de Cabo de Gata', '2026-10-25', 'Cabo de Gata', 'Triatlón', null),
  ('Duatlón Escolar Tri Torrejón', '2026-11-07', 'Torrejón', 'Duatlón', 'Circuito Escolar'),
  ('Behobia-San Sebastián', '2026-11-08', 'Irún - San Sebastián', 'Carrera', null),
  ('Duatlón Cros Escolar Triatlón Valdebebas', '2026-11-14', 'Valdebebas', 'Duatlón', 'Circuito Escolar'),
  ('Duatlón Escolar Triatlón Arganda', '2026-11-28', 'Arganda', 'Duatlón', 'Circuito Escolar');
