-- Control de los correos del reparto semanal a los entrenadores.
-- Cada domingo a las 22h la app manda el reparto de la semana siguiente
-- (src/app/api/cron/reparto-semanal). Esta tabla guarda qué semanas ya se
-- han enviado, para que no se mande dos veces aunque el cron se dispare
-- más de una vez, y para que el director vea cuándo salió.
--
-- `semana` es SIEMPRE el lunes de la semana a la que corresponde el reparto
-- (igual que `asignaciones.semana`).

create table if not exists envios_reparto (
  semana        date primary key,
  enviado_en    timestamptz not null default now(),
  destinatarios int not null default 0,
  origen        text not null default 'automatico'   -- 'automatico' | 'manual'
);

alter table envios_reparto enable row level security;

-- Solo el director lo ve. Escribe el servidor con la clave de servicio.
drop policy if exists p_envios_reparto_leer on envios_reparto;
create policy p_envios_reparto_leer on envios_reparto
  for select using (es_director());
