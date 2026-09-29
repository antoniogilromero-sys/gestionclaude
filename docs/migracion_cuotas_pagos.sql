-- =====================================================================
--  Histórico de pagos mensuales de la cuota (Stripe)
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- `cuotas_stripe` solo guarda el ESTADO ACTUAL de la suscripción
-- (activa/cancelada/impago), no cada cobro mensual por separado — así
-- que no había forma de saber "¿ha pagado ya este mes?" para cada
-- familia. `cuotas_pagos` guarda una fila por cada cobro (factura) real
-- de Stripe, para poder verlo mes a mes.
--
-- No se rellena con un webhook nuevo (eso solo funcionaría hacia
-- adelante, desde el día que se active el evento en Stripe) — se trae
-- bajo demanda con el botón "Sincronizar pagos" en /cuotas, que pide a
-- Stripe el historial de facturas de cada suscripción. Así funciona
-- también con los cobros que ya existían antes de crear esta tabla.

create table cuotas_pagos (
  id                bigint generated always as identity primary key,
  cuota_id          bigint not null references cuotas_stripe (id) on delete cascade,
  stripe_invoice_id text not null unique,
  fecha             date not null,
  importe           numeric(6,2) not null,
  estado            text not null check (estado in ('pagado', 'pendiente')),
  creado_en         timestamptz not null default now()
);

create index on cuotas_pagos (cuota_id, fecha);

alter table cuotas_pagos enable row level security;

-- Solo el director, igual que cuotas_stripe. Sin política de
-- insert/update: la sincronización escribe con la clave de servicio
-- (service_role), que salta el RLS.
create policy p_cuotas_pagos_leer on cuotas_pagos for select using (es_director());
