-- =====================================================================
--  Horarios de entrenamientos (temporada 26/27): Adultos y Escuela
--  Pegar en Supabase > SQL Editor > Run (una sola vez).
--
--  Esto es independiente de `grupos`/`asignaciones` (el reparto semanal
--  de los entrenadores) — es solo un horario de consulta, con lugar,
--  separado por categoría (Adultos, Escuela...).
-- =====================================================================

create table horarios_entrenamiento (
  id            bigint generated always as identity primary key,
  categoria     text not null,
  dia           text not null check (dia in ('lunes','martes','miercoles','jueves','viernes','sabado','domingo')),
  disciplina    text not null,
  hora_inicio   time not null,
  hora_fin      time,
  lugar         text,
  notas         text,
  creado_por    uuid references perfiles (id),
  creado_en     timestamptz not null default now()
);

alter table horarios_entrenamiento enable row level security;

create policy p_horarios_leer   on horarios_entrenamiento for select using (es_director());
create policy p_horarios_crear  on horarios_entrenamiento for insert with check (es_director());
create policy p_horarios_borrar on horarios_entrenamiento for delete using (es_director());

-- Horario que me diste para la temporada 26/27. El lugar del atletismo del
-- jueves de adultos lo he asumido igual que el del lunes (mismo tipo de
-- sesión); si es otro sitio, lo cambias luego desde la propia app.
insert into horarios_entrenamiento (categoria, dia, disciplina, hora_inicio, hora_fin, lugar, notas) values
  ('Adultos', 'lunes',   'Atletismo', '18:00', '19:00', 'Pistas de atletismo de Guadarrama', null),
  ('Adultos', 'martes',  'Natación',  '20:00', '21:00', 'Colegio GSD Guadarrama', null),
  ('Adultos', 'jueves',  'Atletismo', '19:00', '20:00', 'Pistas de atletismo de Guadarrama', null),
  ('Adultos', 'jueves',  'Natación',  '20:00', '21:00', 'Colegio GSD Guadarrama', null),
  ('Adultos', 'sabado',  'MTB',       '10:00', '11:30', 'Dehesa de Alpedrete', null),
  ('Adultos', 'domingo', 'Ciclismo',  '09:00', null,    null, null),
  ('Escuela', 'lunes',   'Atletismo', '18:00', '19:00', 'Pistas de atletismo de Guadarrama', null),
  ('Escuela', 'martes',  'Natación',  '19:00', '20:00', 'Colegio GSD Guadarrama', null),
  ('Escuela', 'jueves',  'Natación',  '19:00', '20:00', 'Colegio GSD Guadarrama', null),
  ('Escuela', 'jueves',  'Atletismo', '18:00', '19:00', 'Pistas de atletismo de Guadarrama', 'A partir de infantil'),
  ('Escuela', 'sabado',  'MTB',       '10:00', '11:30', 'Dehesa de Alpedrete', null);
