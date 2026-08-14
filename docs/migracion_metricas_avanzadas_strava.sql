-- Amplía la integración de Strava con:
--   1. El perfil fisiológico de cada deportista (FTP, FC reposo, ritmo
--      umbral), necesario para poder interpretar sus datos de Strava
--      (potencia relativa, zonas, IF, TSS...). `fc_max_ref` y `peso_ref`
--      ya existían en `deportistas` desde el principio pero no tenían
--      ningún formulario para rellenarlos — ahora sí.
--   2. Una tabla `strava_actividades` para guardar el detalle calculado de
--      cada actividad (NP, TSS, IF, VI en ciclismo; GAP y deriva de FC en
--      carrera). Antes no se guardaba ninguna actividad (todo se pedía en
--      directo); para estos cálculos hace falta descargar el segundo a
--      segundo de cada actividad, y pedirlo en directo cada vez agotaría
--      enseguida el límite de peticiones que permite Strava. Por eso ahora
--      se guarda, y se actualiza solo cuando el director pulsa
--      "Sincronizar métricas avanzadas" en la ficha del deportista — no
--      hay sincronización automática en segundo plano.
--
-- OJO — dos cosas que pidió Antón que Strava NO permite calcular, por
-- mucho sensor que lleve el deportista: SWOLF (número de brazadas) y
-- oscilación vertical / tiempo de contacto en carrera. La API pública de
-- Strava no expone esos datos (son propios de Garmin Connect y no se
-- reenvían a terceros a través de Strava), así que no aparecen en la app.

alter table deportistas
  add column if not exists fc_reposo         int,
  add column if not exists ftp_ciclismo_w    numeric(6,1),
  add column if not exists ftp_carrera_w     numeric(6,1),  -- solo si usa Stryd u otro sensor de potencia en carrera
  add column if not exists ritmo_umbral_s_km numeric(6,1);  -- ritmo umbral de carrera, en segundos por km

create table if not exists strava_actividades (
  id                    bigint primary key,        -- id de la actividad en Strava
  deportista_id         bigint not null references deportistas (id) on delete cascade,
  disciplina            text not null,
  nombre                text not null,
  fecha                 timestamptz not null,
  distancia_m           numeric,
  tiempo_s              int,
  desnivel_m            numeric,
  fc_media              numeric,
  fc_max                numeric,
  cadencia_media        numeric,
  potencia_media_w      numeric,
  potencia_normalizada_w numeric,   -- weighted_average_watts de Strava (ciclismo, y carrera si hay Stryd)
  intensidad_if         numeric,    -- NP / FTP del deportista en esa disciplina
  variabilidad_vi       numeric,    -- NP / potencia media
  tss                   numeric,
  ritmo_gap_s_km        numeric,    -- ritmo ajustado a la pendiente (solo carrera, requiere stream)
  deriva_fc_pct         numeric,    -- desacople cardíaco 2ª mitad vs 1ª mitad (requiere stream)
  sincronizado_en       timestamptz not null default now()
);

alter table strava_actividades enable row level security;

drop policy if exists p_strava_actividades_leer on strava_actividades;
create policy p_strava_actividades_leer on strava_actividades
  for select using (aprobado());
-- Igual que strava_conexiones: nadie escribe desde el navegador, solo el
-- servidor con la clave de servicio al sincronizar.
