-- =====================================================================
--  Cuota mensual de socios por Stripe
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Registro de quién paga la cuota del club por Stripe (suscripción
-- mensual, 44€ o 30€ según el caso). No se rellena a mano ni desde la
-- app: la crea el webhook de Stripe (`/api/stripe/webhook`) cuando
-- alguien completa el pago en /cuota, y la actualiza cuando cambia de
-- estado (se cancela, falla un cobro...).
--
-- Es información económica y de una persona concreta (nombre de quien
-- paga) — solo la ve el director, igual que /inscripciones y /balance.

create table cuotas_stripe (
  id                       bigint generated always as identity primary key,
  nombre_deportista        text not null,
  importe                  numeric(6,2) not null,
  stripe_customer_id       text,
  stripe_subscription_id   text unique,
  estado                   text not null default 'activa', -- activa | cancelada | impago
  creado_en                timestamptz not null default now(),
  actualizado_en           timestamptz not null default now()
);

create index on cuotas_stripe (estado);

alter table cuotas_stripe enable row level security;

-- Solo el director. Sin política de insert/update: las filas las crea y
-- actualiza el webhook con la clave de servicio (service_role), que
-- salta el RLS — igual que strava_conexiones e inscripciones.
create policy p_cuotas_stripe_leer on cuotas_stripe for select using (es_director());
