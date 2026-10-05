-- =====================================================================
--  Pagos reales de septiembre 2026 (cantidades dadas por Antón)
--  Pegar en Supabase > SQL Editor > Run, DESPUÉS de migracion_pagos_reales.sql.
-- =====================================================================
--
-- Se busca a cada entrenador por su CORREO (los de personal_temporada),
-- no por el nombre: varias cuentas se crearon con el correo como nombre
-- y una búsqueda por nombre no las encontraba. Se puede ejecutar más de
-- una vez.
--
-- 1) Las cuentas cuyo nombre es un correo pasan a llamarse como la
--    persona. Es necesario para Diego: la regla "Diego no cobra los
--    lunes" busca el nombre "diego gil gordillo", y con el correo como
--    nombre nunca se le aplicaba. (Sin acentos a propósito: pegar
--    acentos en el SQL Editor a veces los corrompe.)
-- 2) Se guardan las cantidades reales.
--
-- Nimai: Antón dijo "160 + Gredos" sin dar el importe de Gredos, así
-- que se guarda 160 con una nota; hay que sumar Gredos cuando se sepa.

update perfiles p
set nombre = n.nombre
from (
  values
    ('diegogilgordillo@gmail.com',      'Diego Gil Gordillo'),
    ('soniacesteros@gmail.com',         'Sonia'),
    ('c.calderonsantamaria@gmail.com',  'Celia'),
    ('ndelisrojas@gmail.com',           'Nimai'),
    ('llitomtb@gmail.com',              'Hector')
) as n(email, nombre)
where (lower(p.email) = n.email or lower(p.nombre) = n.email)
  and p.nombre like '%@%';

with datos(email, importe, nota) as (
  values
    ('c.calderonsantamaria@gmail.com', 377, null),
    ('ndelisrojas@gmail.com',          160, '160 + Gredos (falta el importe de Gredos)'),
    ('diegogilgordillo@gmail.com',     140, null),
    ('llitomtb@gmail.com',              80, null),
    ('nach.2012@gmail.com',             90, null),
    ('soniacesteros@gmail.com',         15, null)
)
insert into pagos_reales (entrenador_id, mes, importe, nota)
select p.id, date '2026-09-01', d.importe, d.nota
from datos d
join perfiles p
  on lower(p.email) = d.email
 and p.rol in ('director', 'entrenador')
on conflict (entrenador_id, mes) do update
  set importe = excluded.importe,
      nota = excluded.nota,
      actualizado_en = now();

-- Comprobación: todo el equipo, con su cantidad real de septiembre.
-- Tienen que salir con importe Celia, Nimai, Diego, Hector, Nacho y Sonia.
select p.nombre, p.email, p.rol, r.importe
from perfiles p
left join pagos_reales r
  on r.entrenador_id = p.id and r.mes = date '2026-09-01'
where p.rol in ('director', 'entrenador')
order by p.nombre;
