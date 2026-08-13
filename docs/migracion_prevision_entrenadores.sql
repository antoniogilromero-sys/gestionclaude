-- =====================================================================
--  PREVISION DE ENTRENADORES (plantilla semanal orientativa)
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Antón lleva en un Excel propio una plantilla de "quién suele cubrir
-- qué" cada semana (día, hora, entrenador, grupo, disciplina), que luego
-- ajusta a mano en /reparto según la disponibilidad real de cada semana.
-- Esto es SOLO su borrador de referencia — no es lo que ven los
-- entrenadores (eso sigue siendo /reparto, ya con permisos separados).
-- Por eso no está ligado a las tablas grupos/perfiles: son campos de
-- texto libre, como en su Excel, sin arrastrar consecuencias al resto
-- de la app si escribe un nombre que no coincide exactamente con una
-- cuenta real.
create table prevision_entrenadores (
  id            bigint generated always as identity primary key,
  dia           text not null check (dia in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  hora_inicio   time not null,
  hora_fin      time,
  entrenador    text not null,
  grupo         text,
  disciplina    text not null check (disciplina in ('natacion','carrera','mtb','carretera','fuerza')),
  orden         int not null default 0,
  creado_en     timestamptz not null default now()
);

create index on prevision_entrenadores (dia, hora_inicio);

alter table prevision_entrenadores enable row level security;

-- Solo el director la ve y la edita — es su borrador personal.
create policy p_prevision_leer  on prevision_entrenadores for select using (es_director());
create policy p_prevision_admin on prevision_entrenadores for all
  using (es_director()) with check (es_director());
