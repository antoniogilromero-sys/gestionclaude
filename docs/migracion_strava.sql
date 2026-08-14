-- Conexión de cada deportista con su cuenta de Strava. Un deportista se
-- conecta una sola vez desde el enlace público /strava-conectar/[id] (sin
-- login, como /horario-publico) y a partir de ahí el club puede ver su
-- resumen de entrenamientos en /analisis.
--
-- No hay tabla de actividades: no se guarda nada de lo que el deportista
-- entrena, solo el token para poder pedírselo a Strava en directo cada vez
-- que el director abre su ficha (ver src/lib/strava.ts). Menos datos
-- guardados, menos que proteger.
--
-- Nadie escribe aquí desde el navegador: el alta (tras autorizar en
-- Strava) y la renovación del token las hace siempre el servidor con la
-- clave de servicio (createAdminClient), igual que el webhook de
-- inscripciones. Por eso no hay política de insert/update/delete.

create table if not exists strava_conexiones (
  deportista_id    bigint primary key references deportistas (id) on delete cascade,
  strava_atleta_id bigint,
  access_token     text not null,
  refresh_token    text not null,
  expires_at       bigint not null,
  conectado_en     timestamptz not null default now()
);

alter table strava_conexiones enable row level security;

drop policy if exists p_strava_leer on strava_conexiones;
create policy p_strava_leer on strava_conexiones
  for select using (aprobado());
