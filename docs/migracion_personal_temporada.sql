-- =====================================================================
--  Cuadro de personal real (nombre, email, teléfono) — SIN cuenta bancaria
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
--
--  Antes el "cuadro de personal" era una lista de 8 nombres fija en el
--  código (ROSTER_TEMPORADA). Ahora vive aquí, con email y teléfono, para
--  poder cruzarla con quien ya se ha registrado de verdad (por email) y
--  saber a quién le falta invitar. Deliberadamente NO tiene columna de
--  cuenta bancaria: esa decisión ya se tomó, se queda en los ficheros
--  propios de Antón.
-- =====================================================================

create table personal_temporada (
  id        bigint generated always as identity primary key,
  nombre    text not null,
  email     text not null unique,
  telefono  text,
  temporada text not null default '2026/2027'
);

alter table personal_temporada enable row level security;

-- Es un listado de contacto del equipo: solo el director lo ve y lo edita.
create policy p_personal_director on personal_temporada for all
  using (es_director()) with check (es_director());

insert into personal_temporada (nombre, email, telefono) values
  ('Laura',   'lauraopperez@gmail.com',      '682102794'),
  ('Sonia',   'sonicesteros@gmail.com',      '692070081'),
  ('Héctor',  'llitomtb@gmail.com',          '695683229'),
  ('Nimai',   'ndelisrojas@gmail.com',       '640194979'),
  ('Claudia', 'claudiaa.mm20@gmail.com',     '722564220'),
  ('Nacho',   'nach.2012@gmail.com',         '687941360'),
  ('Celia',   'c.calderonsantamaria@gmail.com', '664500245'),
  ('Diego',   'diegogilgordillo10@gmail.com','625367351'),
  ('Toni',    'antoniogilromero@gmail.com',  '605808150')
on conflict (email) do update set
  nombre   = excluded.nombre,
  telefono = excluded.telefono;
