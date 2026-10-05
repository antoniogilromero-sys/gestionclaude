-- =====================================================================
--  Pagos reales a entrenadores (lo que de verdad se abona cada mes)
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- /pagos calcula el coste de cada entrenador al vuelo (horas del
-- reparto x tarifa + pagos extra). Eso es una ESTIMACIÓN: puede no
-- coincidir con lo que realmente se transfiere. Esta tabla guarda la
-- cantidad real de cada entrenador y mes para compararla con la de la
-- app y encontrar de dónde sale cada diferencia.
--
-- 'mes' guarda siempre el día 1, igual que pagos_extra.

create table pagos_reales (
  id             bigint generated always as identity primary key,
  entrenador_id  uuid not null references perfiles (id) on delete cascade,
  mes            date not null,
  importe        numeric(8,2) not null check (importe >= 0),
  nota           text,
  creado_por     uuid references perfiles (id),
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint pagos_reales_mes_es_dia_1 check (extract(day from mes) = 1),
  constraint pagos_reales_unico unique (entrenador_id, mes)
);

create index on pagos_reales (mes);

alter table pagos_reales enable row level security;

-- Información económica del equipo: solo el director.
create policy p_pagosreales_leer       on pagos_reales for select using (es_director());
create policy p_pagosreales_crear      on pagos_reales for insert with check (es_director());
create policy p_pagosreales_actualizar on pagos_reales for update using (es_director()) with check (es_director());
create policy p_pagosreales_borrar     on pagos_reales for delete using (es_director());
