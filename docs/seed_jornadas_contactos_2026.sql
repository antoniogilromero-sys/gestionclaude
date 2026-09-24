-- =====================================================================
--  Colegios contactados este año para talleres (aún sin fecha cerrada)
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- fecha_horario y disciplina son obligatorios en la tabla pero todavía
-- no hay fecha concreta para estos — se dejan como "Por confirmar" y se
-- editan luego desde /jornadas en cuanto se cierre el día con cada
-- colegio (no hace falta volver a tocar SQL para eso).
--
-- El contacto va con el teléfono al lado cuando lo diste, en el mismo
-- campo de texto libre (mismo criterio que ya se usaba, ej. "Carmen").
--
-- Ejecútalo una sola vez: como con seed_jornadas_2026.sql, no hay
-- columna única que evite duplicados si lo pegas dos veces.

insert into jornadas_colegios (anio, colegio, fecha_horario, disciplina, contacto) values
  (2026, 'CEIP Virgen de la Paz (Collado Mediano)', 'Por confirmar', 'Por confirmar', 'Lucía — 650443173'),
  (2026, 'Colegio Virgen de la Almudena (Collado Villalba)', 'Por confirmar', 'Por confirmar', 'Luisa Mata (profesora)'),
  (2026, 'CEIP Cañada Real (Collado Villalba)', 'Por confirmar', 'Por confirmar', 'Patricia — 625400688'),
  (2026, 'CEIP San Miguel Arcángel (Moralzarzal)', 'Por confirmar', 'Por confirmar', 'Enrique'),
  (2026, 'CEIP Clara Campoamor', 'Por confirmar', 'Por confirmar', null);
