-- =====================================================================
--  Pagos extra a entrenadores (gsd, competiciones...) fuera del reparto
--  semanal normal. Pegar en Supabase > SQL Editor > Run (una sola vez).
--
--  El coste "normal" (por horas de grupo × tarifa) ya se calcula al
--  vuelo desde asignaciones + grupos + tarifas_entrenador, así que no se
--  guarda en ninguna tabla. Esto es solo para los pagos sueltos que no
--  salen de ahí (dar una charla en un colegio, cubrir una competición...).
--
--  'mes' guarda siempre el día 1 del mes, igual que 'semana' en
--  asignaciones guarda siempre el lunes — para que no convivan dos
--  formas de escribir el mismo mes.
-- =====================================================================

create table pagos_extra (
  id            bigint generated always as identity primary key,
  entrenador_id uuid   not null references perfiles (id) on delete cascade,
  mes           date   not null,
  concepto      text   not null,
  importe       numeric(8,2) not null check (importe > 0),
  creado_por    uuid references perfiles (id),
  creado_en     timestamptz not null default now(),
  constraint mes_es_dia_1 check (extract(day from mes) = 1)
);

create index on pagos_extra (mes);

alter table pagos_extra enable row level security;

-- Es información económica del equipo: solo el director la ve y la gestiona.
create policy p_pagosextra_leer   on pagos_extra for select using (es_director());
create policy p_pagosextra_crear  on pagos_extra for insert with check (es_director());
create policy p_pagosextra_borrar on pagos_extra for delete using (es_director());
