-- =====================================================================
--  Ampliacion del reparto: grupos de carrera y ciclismo, y tarifas
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================

-- --------------------------------------------------- NUEVOS GRUPOS
-- Carrera a pie / atletismo. Los nombres llevan el prefijo "Carrera" y
-- "Ciclismo" porque el nombre de grupo tiene que ser unico en toda la
-- tabla, y "Intermedio"/"Avanzado" ya existen para natacion.
insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin) values
  ('Carrera Iniciación',  'carrera', '{lunes}',  '18:00', '19:00'),
  ('Carrera Medio',       'carrera', '{lunes}',  '18:00', '19:00'),
  ('Carrera Adultos',     'carrera', '{lunes}',  '18:00', '19:00'),
  ('Carrera Intermedio',  'carrera', '{jueves}', '18:00', '19:00'),
  ('Carrera Avanzado',    'carrera', '{jueves}', '18:00', '19:00'),
  ('Carrera Mayores',     'carrera', '{jueves}', '19:00', '20:00');

-- Ciclismo. La sesion de carretera del domingo no tiene horario fijo
-- (hora_inicio/hora_fin quedan a null): la pantalla lo marca como
-- "horario variable" y no entra en el aviso de solape ni en el calculo
-- de coste hasta que se sepa cuanto dura.
insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin) values
  ('Ciclismo MTB Iniciación', 'ciclismo', '{sabado}',  '10:00', '11:30'),
  ('Ciclismo MTB Medio',      'ciclismo', '{sabado}',  '10:00', '11:30'),
  ('Ciclismo MTB Avanzado',   'ciclismo', '{sabado}',  '10:00', '11:30'),
  ('Ciclismo Carretera',      'ciclismo', '{domingo}', null,     null);

-- --------------------------------------------------------- TARIFAS
-- Tarifa por hora de cada entrenador en cada disciplina. Si un
-- entrenador no tiene fila aqui para una disciplina, la app usa la
-- tarifa general (15 €/h carrera y natacion, 20 €/h ciclismo).
-- Solo hace falta una fila por excepcion, como la de Celia.
create table tarifas_entrenador (
  entrenador_id uuid   not null references perfiles (id) on delete cascade,
  disciplina    text   not null,
  euros_hora    numeric(5,2) not null,
  primary key (entrenador_id, disciplina)
);

alter table tarifas_entrenador enable row level security;

-- Es informacion economica del club: solo la ve y la edita el director.
create policy p_tarifas_director on tarifas_entrenador for all
  using (es_director()) with check (es_director());

-- Excepcion de Celia: 17 €/h en natacion y carrera, 22 €/h en ciclismo.
-- Si no encuentra a Celia (por ejemplo, porque aun no se ha registrado
-- con ese nombre exacto), no inserta nada y no da error.
insert into tarifas_entrenador (entrenador_id, disciplina, euros_hora)
select id, disciplina, euros_hora
from perfiles, (values
  ('natacion', 17.00),
  ('carrera',  17.00),
  ('ciclismo', 22.00)
) as t(disciplina, euros_hora)
where perfiles.nombre = 'Celia'
on conflict (entrenador_id, disciplina) do update set euros_hora = excluded.euros_hora;
