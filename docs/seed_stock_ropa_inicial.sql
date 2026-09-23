-- =====================================================================
--  Carga inicial del stock de camisetas (agosto/septiembre 2026)
--  Pegar en Supabase > SQL Editor > Run — después de haber ejecutado
--  migracion_stock_ropa.sql.
-- =====================================================================
--
-- Donde Antón no dio una cantidad explícita (hombre L, mujer L), se ha
-- asumido 1 unidad — revísalo en la pantalla de Stock y ajusta si no es
-- correcto, no hay que volver a ejecutar SQL para eso.

insert into stock_ropa (tipo, genero, talla, cantidad) values
  ('algodon', 'hombre', 'L', 1),
  ('algodon', 'mujer',  'L', 1),
  ('algodon', 'unisex', 'M', 2),
  ('algodon', 'unisex', 'S', 2),
  ('tecnica', 'unisex', '8', 2),
  ('tecnica', 'mujer',  'M', 2),
  ('tecnica', 'hombre', 'S', 1);
