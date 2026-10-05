-- =====================================================================
--  Pagos reales de septiembre 2026 (cantidades dadas por Antón)
--  Pegar en Supabase > SQL Editor > Run, DESPUÉS de migracion_pagos_reales.sql.
-- =====================================================================
--
-- Se busca a cada entrenador por el principio de su nombre (sin
-- acentos ni mayúsculas). Se puede ejecutar más de una vez: si ya
-- existe la cantidad de ese entrenador y mes, se actualiza.
--
-- Nimai: Antón dijo "160 + Gredos" sin dar el importe de Gredos, así
-- que se guarda 160 con una nota; hay que sumar Gredos cuando se sepa.

with datos(patron, importe, nota) as (
  values
    ('celia%',  377, null),
    ('nimai%',  160, '160 + Gredos (falta el importe de Gredos)'),
    ('diego%',  140, null),
    ('hector%',  80, null),
    ('nacho%',   90, null),
    ('sonia%',   15, null)
)
insert into pagos_reales (entrenador_id, mes, importe, nota)
select p.id, date '2026-09-01', d.importe, d.nota
from datos d
join perfiles p
  on unaccent(lower(p.nombre)) like d.patron
 and p.rol in ('director', 'entrenador')
on conflict (entrenador_id, mes) do update
  set importe = excluded.importe,
      nota = excluded.nota,
      actualizado_en = now();

-- Comprobación: tienen que salir los 6, cada uno con su cantidad.
select p.nombre, r.importe, r.nota
from pagos_reales r
join perfiles p on p.id = r.entrenador_id
where r.mes = date '2026-09-01'
order by p.nombre;
