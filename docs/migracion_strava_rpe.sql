-- Percepción del esfuerzo (RPE) por actividad de Strava. Strava no tiene
-- este dato — lo escribe a mano el director o el entrenador que estuvo en
-- el entrenamiento, así que no está ligado a ninguna sincronización
-- automática, se guarda aparte con el id de la actividad de Strava.

create table if not exists strava_rpe (
  strava_actividad_id bigint primary key,
  deportista_id        bigint not null references deportistas (id) on delete cascade,
  rpe                  int not null check (rpe between 1 and 10),
  notas                text,
  registrado_por        uuid references perfiles (id),
  creado_en            timestamptz not null default now(),
  actualizado_en       timestamptz not null default now()
);

create index on strava_rpe (deportista_id);

alter table strava_rpe enable row level security;

-- Director y entrenador pueden leer y escribir (son quienes están en el
-- entrenamiento del día a día) — a diferencia de strava_conexiones y
-- strava_actividades, que solo escribe el servidor.
drop policy if exists p_strava_rpe_leer on strava_rpe;
create policy p_strava_rpe_leer on strava_rpe
  for select using (aprobado());

drop policy if exists p_strava_rpe_escribir on strava_rpe;
create policy p_strava_rpe_escribir on strava_rpe
  for insert with check (aprobado());

drop policy if exists p_strava_rpe_actualizar on strava_rpe;
create policy p_strava_rpe_actualizar on strava_rpe
  for update using (aprobado());
