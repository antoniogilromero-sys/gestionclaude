-- Carga histórica del Balance, temporada 2025/2026 (septiembre a junio),
-- a partir de las hojas de gastos e ingresos que dio Antón. Cada celda no
-- vacía de sus tablas es una fila. Requiere haber ejecutado antes
-- docs/migracion_balance.sql.

insert into movimientos_club (tipo, categoria, importe, fecha) values
  -- Septiembre 2025
  ('gasto', 'Piscina', 908, '2025-09-01'),
  ('gasto', 'Entrenadores', 675, '2025-09-01'),
  ('gasto', 'Camisetas', 280, '2025-09-01'),
  ('gasto', 'Pista', 264, '2025-09-01'),
  ('ingreso', 'Socios club SEPA', 2741, '2025-09-01'),

  -- Octubre 2025
  ('gasto', 'Piscina', 1198, '2025-10-01'),
  ('gasto', 'Entrenadores', 800, '2025-10-01'),
  ('gasto', 'Pista', 282, '2025-10-01'),
  ('gasto', 'Gorro', 200, '2025-10-01'),
  ('ingreso', 'Socios club SEPA', 2956, '2025-10-01'),
  ('ingreso', 'Socios transferencia', 300, '2025-10-01'),
  ('ingreso', 'GSD', 129, '2025-10-01'),

  -- Noviembre 2025
  ('gasto', 'Piscina', 932, '2025-11-01'),
  ('gasto', 'Entrenadores', 740, '2025-11-01'),
  ('gasto', 'Seguro', 379, '2025-11-01'),
  ('gasto', 'Pista', 292, '2025-11-01'),
  ('ingreso', 'Socios club SEPA', 2960, '2025-11-01'),
  ('ingreso', 'Socios transferencia', 300, '2025-11-01'),
  ('ingreso', 'GSD', 129, '2025-11-01'),

  -- Diciembre 2025
  ('gasto', 'Piscina', 756, '2025-12-01'),
  ('gasto', 'Liga de clubs', 1100, '2025-12-01'),
  ('gasto', 'Entrenadores', 690, '2025-12-01'),
  ('gasto', 'Pista', 254, '2025-12-01'),
  ('gasto', 'Licencia', 300, '2025-12-01'),
  ('ingreso', 'Socios club SEPA', 2964, '2025-12-01'),
  ('ingreso', 'Socios transferencia', 300, '2025-12-01'),
  ('ingreso', 'Subvención', 529, '2025-12-01'),
  ('ingreso', 'GSD', 129, '2025-12-01'),

  -- Enero 2026
  ('gasto', 'Piscina', 456, '2026-01-01'),
  ('gasto', 'Entrenadores', 490, '2026-01-01'),
  ('gasto', 'Pista', 247, '2026-01-01'),
  ('ingreso', 'Socios club SEPA', 2933, '2026-01-01'),
  ('ingreso', 'Socios transferencia', 300, '2026-01-01'),
  ('ingreso', 'GSD', 129, '2026-01-01'),

  -- Febrero 2026
  ('gasto', 'Piscina', 1052, '2026-02-01'),
  ('gasto', 'Entrenadores', 750, '2026-02-01'),
  ('gasto', 'Pista', 250, '2026-02-01'),
  ('gasto', 'Casas', 670, '2026-02-01'),
  ('gasto', 'Gasolina', 100, '2026-02-01'),
  ('gasto', 'Compra', 120, '2026-02-01'),
  ('ingreso', 'Socios club SEPA', 2877, '2026-02-01'),
  ('ingreso', 'Socios transferencia', 300, '2026-02-01'),
  ('ingreso', 'GSD', 129, '2026-02-01'),

  -- Marzo 2026
  ('gasto', 'Piscina', 1000, '2026-03-01'),
  ('gasto', 'Entrenadores', 900, '2026-03-01'),
  ('gasto', 'Pista', 250, '2026-03-01'),
  ('gasto', 'Casas', 500, '2026-03-01'),
  ('gasto', 'Gasolina', 100, '2026-03-01'),
  ('gasto', 'Compra', 120, '2026-03-01'),
  ('ingreso', 'Socios club SEPA', 2950, '2026-03-01'),
  ('ingreso', 'Socios transferencia', 300, '2026-03-01'),
  ('ingreso', 'Subvención', 300, '2026-03-01'),
  ('ingreso', 'GSD', 129, '2026-03-01'),

  -- Abril 2026
  ('gasto', 'Piscina', 1100, '2026-04-01'),
  ('gasto', 'Entrenadores', 750, '2026-04-01'),
  ('gasto', 'Pista', 280, '2026-04-01'),
  ('gasto', 'Gasolina', 100, '2026-04-01'),
  ('gasto', 'Compra', 120, '2026-04-01'),
  ('ingreso', 'Socios club SEPA', 2850, '2026-04-01'),
  ('ingreso', 'Socios transferencia', 300, '2026-04-01'),
  ('ingreso', 'GSD', 129, '2026-04-01'),

  -- Mayo 2026
  ('gasto', 'Piscina', 1100, '2026-05-01'),
  ('gasto', 'Entrenadores', 900, '2026-05-01'),
  ('gasto', 'Pista', 280, '2026-05-01'),
  ('ingreso', 'Socios club SEPA', 2850, '2026-05-01'),
  ('ingreso', 'Socios transferencia', 300, '2026-05-01'),
  ('ingreso', 'GSD', 129, '2026-05-01'),

  -- Junio 2026
  ('gasto', 'Piscina', 700, '2026-06-01'),
  ('gasto', 'Entrenadores', 730, '2026-06-01'),
  ('gasto', 'Pista', 280, '2026-06-01'),
  ('gasto', 'Casas', 400, '2026-06-01'),
  ('gasto', 'Material', 100, '2026-06-01'),
  ('gasto', 'Gorro', 300, '2026-06-01'),
  ('gasto', 'Gasolina', 100, '2026-06-01'),
  ('gasto', 'Compra', 120, '2026-06-01'),
  ('ingreso', 'Socios club SEPA', 2700, '2026-06-01'),
  ('ingreso', 'Socios transferencia', 300, '2026-06-01'),
  ('ingreso', 'GSD', 129, '2026-06-01');
