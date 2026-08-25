-- =====================================================================
--  Biblioteca de rutas (ciclismo carretera / MTB), generada desde Strava
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- No es un catálogo que se rellena a mano: se genera pulsando
-- "Sincronizar rutas" en /rutas, que recorre a TODOS los deportistas con
-- Strava conectado (`strava_conexiones`) y guarda sus salidas de
-- ciclismo de los últimos 90 días, clasificadas en carretera o montaña
-- según el tipo de actividad de Strava. Cada vez que se pulsa el botón
-- se van sumando salidas nuevas (no se borran las de antes), así la
-- biblioteca crece con el tiempo sin tener que traer todo el histórico
-- de golpe.
--
-- Tabla ligera a propósito: solo lo necesario para una biblioteca de
-- rutas (nombre, distancia, desnivel, quién la hizo, enlace a Strava) —
-- no duplica `strava_actividades` (esa es para las métricas avanzadas de
-- rendimiento — NP/TSS/GAP —, con su propio flujo de sincronización por
-- deportista individual en /analisis).

create table if not exists rutas_strava (
  id             bigint primary key,        -- id de la actividad en Strava
  deportista_id  bigint not null references deportistas (id) on delete cascade,
  tipo           text not null check (tipo in ('carretera', 'montana')),
  nombre         text not null,
  distancia_km   numeric(6,2),
  desnivel_m     numeric,
  fecha          timestamptz not null,
  sincronizado_en timestamptz not null default now()
);

create index on rutas_strava (tipo, fecha desc);

alter table rutas_strava enable row level security;

-- Director y entrenador consultan la biblioteca; nadie escribe desde el
-- navegador, solo el servidor con la clave de servicio al sincronizar
-- (mismo patrón que strava_conexiones y strava_actividades).
create policy p_rutas_leer on rutas_strava for select using (aprobado());
