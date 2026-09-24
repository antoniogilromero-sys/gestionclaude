-- =====================================================================
--  Seguimiento de lesiones
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Dos tablas: `lesiones` (una fila por lesión: quién, cuándo, qué zona,
-- si sigue activa o ya se ha recuperado) y `lesion_seguimiento` (el
-- "subapartado de programación" que pidió Antón — notas de texto libre
-- por fecha, como un diario de cómo va evolucionando: reposo, empieza
-- fisio, vuelta progresiva...).
--
-- Visibilidad confirmada por Antón: el director gestiona todo (da de
-- alta la lesión, la marca como recuperada, añade las notas de
-- seguimiento); los entrenadores solo consultan — lo necesitan porque
-- están a pie de pista/piscina con el deportista a diario y tienen que
-- saber qué puede o no puede hacer, pero no editan nada aquí.

create table lesiones (
  id                bigint generated always as identity primary key,
  deportista_id     bigint not null references deportistas (id) on delete cascade,
  fecha_lesion      date not null,
  zona              text,
  descripcion       text not null,
  estado            text not null default 'activa' check (estado in ('activa', 'recuperado')),
  fecha_recuperacion date,
  creado_por        uuid references perfiles (id),
  creado_en         timestamptz not null default now()
);

create index on lesiones (deportista_id);
create index on lesiones (estado);

create table lesion_seguimiento (
  id          bigint generated always as identity primary key,
  lesion_id   bigint not null references lesiones (id) on delete cascade,
  fecha       date not null,
  nota        text not null,
  creado_por  uuid references perfiles (id),
  creado_en   timestamptz not null default now()
);

create index on lesion_seguimiento (lesion_id, fecha);

alter table lesiones enable row level security;
alter table lesion_seguimiento enable row level security;

create policy p_lesiones_leer      on lesiones for select using (aprobado());
create policy p_lesiones_crear     on lesiones for insert with check (es_director());
create policy p_lesiones_actualizar on lesiones for update using (es_director()) with check (es_director());
create policy p_lesiones_borrar    on lesiones for delete using (es_director());

create policy p_lesionseg_leer  on lesion_seguimiento for select using (aprobado());
create policy p_lesionseg_admin on lesion_seguimiento for all
  using (es_director()) with check (es_director());
