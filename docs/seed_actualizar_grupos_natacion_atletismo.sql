-- =====================================================================
--  Actualiza los grupos de natación (12) y atletismo del lunes (4) con
--  la hoja "Hoja 3" tal como está ahora (agosto 2026)
--  Pegar entero en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- A diferencia de la primera carga (seed_sync_grupos_natacion.sql, que
-- solo añadía), esta RECONCILIA cada uno de estos 16 grupos con la hoja
-- actual: añade a quien falte y QUITA (del grupo, no borra al
-- deportista) a quien ya no esté en la lista de ese grupo en la hoja.
-- No toca "Jueves 18h" (esa columna ya no existe en la hoja) ni ningún
-- otro grupo que no sea uno de estos 16.
--
-- La fila que en la hoja solo decía "Ramón" (sin apellido, en Atletismo
-- 3 Lunes) es Ramón Cabañas Giron, según confirmó Antón — no es Ramón
-- Hernando (que ya está en otros grupos como persona distinta).

with roster(nombre, grupo_nombre) as (
  values
  ('Carlos Pereda Lostau', 'MARTES PEQUES 19H'),
  ('Leon Strumbo Wilson', 'MARTES PEQUES 19H'),
  ('Lola López Moreno', 'MARTES PEQUES 19H'),
  ('María Simpson', 'MARTES PEQUES 19H'),
  ('Quique López Moreno', 'MARTES PEQUES 19H'),
  ('Rosa Strumbo Wilson', 'MARTES PEQUES 19H'),
  ('Martín Arribas del Amo', 'MARTES PEQUES 19H'),
  ('Lucia Simon Perez', 'MARTES MEDIO 19H'),
  ('David del Río Pascual', 'MARTES MEDIO 19H'),
  ('Hugo Jiménez Ocaña', 'MARTES MEDIO 19H'),
  ('Fernando Niño Martínez', 'MARTES MEDIO 19H'),
  ('Ramón Hernando', 'MARTES MEDIO 19H'),
  ('Maria Moreno', 'MARTES MEDIO 19H'),
  ('Elena Perez Ruiz', 'MARTES MEDIO 19H'),
  ('Jorge del Río Serrano', 'MARTES MEDIO 19H'),
  ('JAIME CONTRERAS LOPEZ', 'MARTES AVANZADO 19H'),
  ('Carolina Sánchez perez', 'MARTES AVANZADO 19H'),
  ('Celia Pereda Lostau', 'MARTES AVANZADO 19H'),
  ('Hugo Simon Perez', 'MARTES AVANZADO 19H'),
  ('Luis Miguel Blázquez Iznaol', 'MARTES AVANZADO 19H'),
  ('Isabel Simpson', 'MARTES AVANZADO 19H'),
  ('Peter Simpson', 'MARTES AVANZADO 19H'),
  ('Daniel Bárez Carballo', 'MARTES AVANZADO 19H'),
  ('Saul Tabasco Alonso', 'MARTES AVANZADO 19H'),
  ('Lucas Bernardo Strumbo', 'MARTES AVANZADO 19H'),
  ('Hector Javier de la calle Gonzalez', 'MARTES BAJO 20H'),
  ('Sonia Andres Conde', 'MARTES BAJO 20H'),
  ('Paloma Canales Espi', 'MARTES BAJO 20H'),
  ('Luis Cerrillo Arias', 'MARTES BAJO 20H'),
  ('Daniel Puche Hontanilla', 'MARTES BAJO 20H'),
  ('Jaime Garrido Mariscal', 'MARTES BAJO 20H'),
  ('Sergio de la Camara Sanz', 'MARTES BAJO 20H'),
  ('ana Carmen Pozo Pascual', 'MARTES BAJO 20H'),
  ('Andreína Maris', 'MARTES BAJO 20H'),
  ('Miguel Ángel Pedrosa Hiruelas', 'MARTES MEDIO 20H'),
  ('juan aparicio Manzano', 'MARTES MEDIO 20H'),
  ('Sonia Cesteros Garcia', 'MARTES MEDIO 20H'),
  ('JAVIER CERDEIRA MELERO', 'MARTES MEDIO 20H'),
  ('Paula Holguín Segovia', 'MARTES MEDIO 20H'),
  ('Sandra Machado Henares', 'MARTES MEDIO 20H'),
  ('Manuel Arenas Mateos', 'MARTES MEDIO 20H'),
  ('Jaime González Marcos', 'MARTES MEDIO 20H'),
  ('Daniel Castro Márquez', 'MARTES MEDIO 20H'),
  ('Nimai Pandit Delis Rojas', 'MARTES MEDIO 20H'),
  ('David Fernández Álvarez', 'MARTES AVANZADO 20H'),
  ('ALICIA DELGADO PRIETO', 'MARTES AVANZADO 20H'),
  ('Diego Gil  Gordillo', 'MARTES AVANZADO 20H'),
  ('Martina Pous Ribagorda', 'MARTES AVANZADO 20H'),
  ('Julia Millo Bretin', 'MARTES AVANZADO 20H'),
  ('María Caballero de la Cruz', 'MARTES AVANZADO 20H'),
  ('Alejandro Sanchez Martin', 'MARTES AVANZADO 20H'),
  ('Sergio San Fruto Conde', 'MARTES AVANZADO 20H'),
  ('Quique López Moreno', 'JUEVES PEQUES 19H'),
  ('Vega Delgado de Felix', 'JUEVES PEQUES 19H'),
  ('Saúl Niño Negreira', 'JUEVES PEQUES 19H'),
  ('Carlos Pereda Lostau', 'JUEVES PEQUES 19H'),
  ('María Simpson', 'JUEVES PEQUES 19H'),
  ('Mario tejero maria', 'JUEVES PEQUES 19H'),
  ('TULIO RUIZ DELGADO', 'JUEVES PEQUES 19H'),
  ('Angelina De La Rua Mazza', 'JUEVES PEQUES 19H'),
  ('Lola López Moreno', 'JUEVES PEQUES 19H'),
  ('Martín Arribas del Amo', 'JUEVES PEQUES 19H'),
  ('david de lorenzo Macías', 'JUEVES PEQUES 19H'),
  ('Elena Perez Ruiz', 'JUEVES MEDIO 19H'),
  ('Lucia Simon Perez', 'JUEVES MEDIO 19H'),
  ('Noa Lopez Herrera', 'JUEVES MEDIO 19H'),
  ('Hugo Jiménez Ocaña', 'JUEVES MEDIO 19H'),
  ('Rosa Negreira Hernandez', 'JUEVES MEDIO 19H'),
  ('Ramón Hernando', 'JUEVES MEDIO 19H'),
  ('Lara de Diego Gustin', 'JUEVES MEDIO 19H'),
  ('Anaïs Rodriguez Bastiani', 'JUEVES MEDIO 19H'),
  ('Maria Moreno', 'JUEVES MEDIO 19H'),
  ('Peter Simpson', 'JUEVES AVANZADO 19H'),
  ('Carolina Sánchez perez', 'JUEVES AVANZADO 19H'),
  ('Isabel Simpson', 'JUEVES AVANZADO 19H'),
  ('Saul Tabasco Alonso', 'JUEVES AVANZADO 19H'),
  ('Celia Pereda Lostau', 'JUEVES AVANZADO 19H'),
  ('JAIME CONTRERAS LOPEZ', 'JUEVES AVANZADO 19H'),
  ('Hugo Simon Perez', 'JUEVES AVANZADO 19H'),
  ('Daniel Bárez Carballo', 'JUEVES AVANZADO 19H'),
  ('Luis Cerrillo Arias', 'JUEVES BAJO 20H'),
  ('Paloma Canales Espi', 'JUEVES BAJO 20H'),
  ('Andreína Maris', 'JUEVES BAJO 20H'),
  ('ana Carmen Pozo Pascual', 'JUEVES BAJO 20H'),
  ('José Luis Plaza Canga-Arguelles', 'JUEVES BAJO 20H'),
  ('Jaime Garrido Mariscal', 'JUEVES BAJO 20H'),
  ('Sergio de la Camara Sanz', 'JUEVES BAJO 20H'),
  ('Daniel Puche Hontanilla', 'JUEVES BAJO 20H'),
  ('Sonia Andres Conde', 'JUEVES BAJO 20H'),
  ('Sandra Machado Henares', 'JUEVES BAJO 20H'),
  ('Daniel Castro Márquez', 'JUEVES MEDIO 20H'),
  ('Paula Holguín Segovia', 'JUEVES MEDIO 20H'),
  ('juan aparicio Manzano', 'JUEVES MEDIO 20H'),
  ('Miguel Ángel Pedrosa Hiruelas', 'JUEVES MEDIO 20H'),
  ('Manuel Arenas Mateos', 'JUEVES MEDIO 20H'),
  ('Sonia Cesteros Garcia', 'JUEVES MEDIO 20H'),
  ('Jaime González Marcos', 'JUEVES MEDIO 20H'),
  ('Nimai Pandit Delis Rojas', 'JUEVES AVANZADO 20H'),
  ('David Fernández Álvarez', 'JUEVES AVANZADO 20H'),
  ('Diego Gil  Gordillo', 'JUEVES AVANZADO 20H'),
  ('Sergio San Fruto Conde', 'JUEVES AVANZADO 20H'),
  ('Alejandro Sanchez Martin', 'JUEVES AVANZADO 20H'),
  ('Martina Pous Ribagorda', 'JUEVES AVANZADO 20H'),
  ('ALICIA DELGADO PRIETO', 'JUEVES AVANZADO 20H'),
  ('Julia Millo Bretin', 'JUEVES AVANZADO 20H'),
  ('JAVIER CERDEIRA MELERO', 'JUEVES AVANZADO 20H'),
  ('Angelina De La Rua Mazza', 'ATLETISMO 1A LUNES'),
  ('Carlos Pereda Lostau', 'ATLETISMO 1A LUNES'),
  ('david de lorenzo Macías', 'ATLETISMO 1A LUNES'),
  ('Leon Strumbo Wilson', 'ATLETISMO 1A LUNES'),
  ('Lola López Moreno', 'ATLETISMO 1A LUNES'),
  ('María Simpson', 'ATLETISMO 1A LUNES'),
  ('Mario tejero maria', 'ATLETISMO 1A LUNES'),
  ('Martín Arribas del Amo', 'ATLETISMO 1A LUNES'),
  ('Quique López Moreno', 'ATLETISMO 1A LUNES'),
  ('Rosa Strumbo Wilson', 'ATLETISMO 1A LUNES'),
  ('Saúl Niño Negreira', 'ATLETISMO 1A LUNES'),
  ('TULIO RUIZ DELGADO', 'ATLETISMO 1A LUNES'),
  ('Vega Delgado de Felix', 'ATLETISMO 1A LUNES'),
  ('Lucia Simon Perez', 'ATLETISMO 1B LUNES'),
  ('Noa Lopez Herrera', 'ATLETISMO 1B LUNES'),
  ('Maria Moreno', 'ATLETISMO 1B LUNES'),
  ('Jorge del Río Serrano', 'ATLETISMO 1B LUNES'),
  ('Jara Lahera Sánchez', 'ATLETISMO 1B LUNES'),
  ('Guillermo González Serralta', 'ATLETISMO 2 LUNES'),
  ('JAIME CONTRERAS LOPEZ', 'ATLETISMO 2 LUNES'),
  ('María Caballero de la Cruz', 'ATLETISMO 2 LUNES'),
  ('Julia Millo Bretin', 'ATLETISMO 2 LUNES'),
  ('Anaïs Rodriguez Bastiani', 'ATLETISMO 2 LUNES'),
  ('Hugo Jiménez Ocaña', 'ATLETISMO 2 LUNES'),
  ('Celia Pereda Lostau', 'ATLETISMO 2 LUNES'),
  ('Isabel Simpson', 'ATLETISMO 2 LUNES'),
  ('Saul Tabasco Alonso', 'ATLETISMO 2 LUNES'),
  ('Daniel Bárez Carballo', 'ATLETISMO 2 LUNES'),
  ('ALICIA DELGADO PRIETO', 'ATLETISMO 2 LUNES'),
  ('Diego Gil  Gordillo', 'ATLETISMO 2 LUNES'),
  ('Martina Pous Ribagorda', 'ATLETISMO 2 LUNES'),
  ('Hugo Simon Perez', 'ATLETISMO 2 LUNES'),
  ('Fernando Niño Martínez', 'ATLETISMO 3 LUNES'),
  ('Paloma Rojas Vaquero', 'ATLETISMO 3 LUNES'),
  ('Elena Perez Ruiz', 'ATLETISMO 3 LUNES'),
  ('David del Río Pascual', 'ATLETISMO 3 LUNES'),
  ('Rosa Negreira Hernandez', 'ATLETISMO 3 LUNES'),
  ('Lara de Diego Gustin', 'ATLETISMO 3 LUNES'),
  ('Carolina Sánchez perez', 'ATLETISMO 3 LUNES'),
  ('Luis Miguel Blázquez Iznaol', 'ATLETISMO 3 LUNES'),
  ('Peter Simpson', 'ATLETISMO 3 LUNES'),
  ('Hector Javier de la calle Gonzalez', 'ATLETISMO 3 LUNES'),
  ('Paloma Canales Espi', 'ATLETISMO 3 LUNES'),
  ('Sonia Andres Conde', 'ATLETISMO 3 LUNES'),
  ('Daniel Puche Hontanilla', 'ATLETISMO 3 LUNES'),
  ('Jaime Garrido Mariscal', 'ATLETISMO 3 LUNES'),
  ('Sergio de la Camara Sanz', 'ATLETISMO 3 LUNES'),
  ('Luis Cerrillo Arias', 'ATLETISMO 3 LUNES'),
  ('ana Carmen Pozo Pascual', 'ATLETISMO 3 LUNES'),
  ('Andreína Maris', 'ATLETISMO 3 LUNES'),
  ('Miguel Ángel Pedrosa Hiruelas', 'ATLETISMO 3 LUNES'),
  ('JAVIER CERDEIRA MELERO', 'ATLETISMO 3 LUNES'),
  ('Nimai Pandit Delis Rojas', 'ATLETISMO 3 LUNES'),
  ('Paula Holguín Segovia', 'ATLETISMO 3 LUNES'),
  ('Daniel Castro Márquez', 'ATLETISMO 3 LUNES'),
  ('Sandra Machado Henares', 'ATLETISMO 3 LUNES'),
  ('Jaime González Marcos', 'ATLETISMO 3 LUNES'),
  ('David Fernández Álvarez', 'ATLETISMO 3 LUNES'),
  ('Alejandro Sanchez Martin', 'ATLETISMO 3 LUNES'),
  ('Ramón Cabañas Giron', 'ATLETISMO 3 LUNES')
),
grupos_norm as (
  select g.id as grupo_id, g.nombre as grupo_nombre_real,
    regexp_replace(unaccent(lower(trim(g.nombre))), '\s+', ' ', 'g') as clave
  from grupos g
  where unaccent(lower(g.nombre)) in (
    select regexp_replace(unaccent(lower(trim(r.grupo_nombre))), '\s+', ' ', 'g') from roster r
  )
),
roster_con_grupo as (
  select r.nombre,
    regexp_replace(unaccent(lower(trim(r.grupo_nombre))), '\s+', ' ', 'g') as clave
  from roster r
),
esperados as (
  select distinct nombre from roster
),
a_insertar as (
  select e.nombre
  from esperados e
  where not exists (
    select 1 from deportistas d
    where unaccent(lower(d.nombre)) = unaccent(lower(e.nombre))
  )
),
insertados as (
  insert into deportistas (nombre, activo)
  select nombre, true from a_insertar
  returning id, nombre
),
todos as (
  select id, nombre from insertados
  union all
  select d.id, d.nombre from deportistas d
  where unaccent(lower(d.nombre)) in (select unaccent(lower(nombre)) from esperados)
),
roster_ids as (
  select distinct t.id as deportista_id, gn.grupo_id
  from roster_con_grupo rc
  join todos t on unaccent(lower(t.nombre)) = unaccent(lower(rc.nombre))
  join grupos_norm gn on gn.clave = rc.clave
)
-- Quita de estos 16 grupos a quien ya no está en la hoja
delete from deportista_grupo dg
using grupos_norm gn
where dg.grupo_id = gn.grupo_id
  and not exists (
    select 1 from roster_ids ri
    where ri.grupo_id = dg.grupo_id and ri.deportista_id = dg.deportista_id
  );

-- (segunda sentencia: hace falta repetir el CTE porque el anterior WITH
-- solo vale para la sentencia inmediatamente siguiente)
with roster(nombre, grupo_nombre) as (
  values
  ('Carlos Pereda Lostau', 'MARTES PEQUES 19H'),
  ('Leon Strumbo Wilson', 'MARTES PEQUES 19H'),
  ('Lola López Moreno', 'MARTES PEQUES 19H'),
  ('María Simpson', 'MARTES PEQUES 19H'),
  ('Quique López Moreno', 'MARTES PEQUES 19H'),
  ('Rosa Strumbo Wilson', 'MARTES PEQUES 19H'),
  ('Martín Arribas del Amo', 'MARTES PEQUES 19H'),
  ('Lucia Simon Perez', 'MARTES MEDIO 19H'),
  ('David del Río Pascual', 'MARTES MEDIO 19H'),
  ('Hugo Jiménez Ocaña', 'MARTES MEDIO 19H'),
  ('Fernando Niño Martínez', 'MARTES MEDIO 19H'),
  ('Ramón Hernando', 'MARTES MEDIO 19H'),
  ('Maria Moreno', 'MARTES MEDIO 19H'),
  ('Elena Perez Ruiz', 'MARTES MEDIO 19H'),
  ('Jorge del Río Serrano', 'MARTES MEDIO 19H'),
  ('JAIME CONTRERAS LOPEZ', 'MARTES AVANZADO 19H'),
  ('Carolina Sánchez perez', 'MARTES AVANZADO 19H'),
  ('Celia Pereda Lostau', 'MARTES AVANZADO 19H'),
  ('Hugo Simon Perez', 'MARTES AVANZADO 19H'),
  ('Luis Miguel Blázquez Iznaol', 'MARTES AVANZADO 19H'),
  ('Isabel Simpson', 'MARTES AVANZADO 19H'),
  ('Peter Simpson', 'MARTES AVANZADO 19H'),
  ('Daniel Bárez Carballo', 'MARTES AVANZADO 19H'),
  ('Saul Tabasco Alonso', 'MARTES AVANZADO 19H'),
  ('Lucas Bernardo Strumbo', 'MARTES AVANZADO 19H'),
  ('Hector Javier de la calle Gonzalez', 'MARTES BAJO 20H'),
  ('Sonia Andres Conde', 'MARTES BAJO 20H'),
  ('Paloma Canales Espi', 'MARTES BAJO 20H'),
  ('Luis Cerrillo Arias', 'MARTES BAJO 20H'),
  ('Daniel Puche Hontanilla', 'MARTES BAJO 20H'),
  ('Jaime Garrido Mariscal', 'MARTES BAJO 20H'),
  ('Sergio de la Camara Sanz', 'MARTES BAJO 20H'),
  ('ana Carmen Pozo Pascual', 'MARTES BAJO 20H'),
  ('Andreína Maris', 'MARTES BAJO 20H'),
  ('Miguel Ángel Pedrosa Hiruelas', 'MARTES MEDIO 20H'),
  ('juan aparicio Manzano', 'MARTES MEDIO 20H'),
  ('Sonia Cesteros Garcia', 'MARTES MEDIO 20H'),
  ('JAVIER CERDEIRA MELERO', 'MARTES MEDIO 20H'),
  ('Paula Holguín Segovia', 'MARTES MEDIO 20H'),
  ('Sandra Machado Henares', 'MARTES MEDIO 20H'),
  ('Manuel Arenas Mateos', 'MARTES MEDIO 20H'),
  ('Jaime González Marcos', 'MARTES MEDIO 20H'),
  ('Daniel Castro Márquez', 'MARTES MEDIO 20H'),
  ('Nimai Pandit Delis Rojas', 'MARTES MEDIO 20H'),
  ('David Fernández Álvarez', 'MARTES AVANZADO 20H'),
  ('ALICIA DELGADO PRIETO', 'MARTES AVANZADO 20H'),
  ('Diego Gil  Gordillo', 'MARTES AVANZADO 20H'),
  ('Martina Pous Ribagorda', 'MARTES AVANZADO 20H'),
  ('Julia Millo Bretin', 'MARTES AVANZADO 20H'),
  ('María Caballero de la Cruz', 'MARTES AVANZADO 20H'),
  ('Alejandro Sanchez Martin', 'MARTES AVANZADO 20H'),
  ('Sergio San Fruto Conde', 'MARTES AVANZADO 20H'),
  ('Quique López Moreno', 'JUEVES PEQUES 19H'),
  ('Vega Delgado de Felix', 'JUEVES PEQUES 19H'),
  ('Saúl Niño Negreira', 'JUEVES PEQUES 19H'),
  ('Carlos Pereda Lostau', 'JUEVES PEQUES 19H'),
  ('María Simpson', 'JUEVES PEQUES 19H'),
  ('Mario tejero maria', 'JUEVES PEQUES 19H'),
  ('TULIO RUIZ DELGADO', 'JUEVES PEQUES 19H'),
  ('Angelina De La Rua Mazza', 'JUEVES PEQUES 19H'),
  ('Lola López Moreno', 'JUEVES PEQUES 19H'),
  ('Martín Arribas del Amo', 'JUEVES PEQUES 19H'),
  ('david de lorenzo Macías', 'JUEVES PEQUES 19H'),
  ('Elena Perez Ruiz', 'JUEVES MEDIO 19H'),
  ('Lucia Simon Perez', 'JUEVES MEDIO 19H'),
  ('Noa Lopez Herrera', 'JUEVES MEDIO 19H'),
  ('Hugo Jiménez Ocaña', 'JUEVES MEDIO 19H'),
  ('Rosa Negreira Hernandez', 'JUEVES MEDIO 19H'),
  ('Ramón Hernando', 'JUEVES MEDIO 19H'),
  ('Lara de Diego Gustin', 'JUEVES MEDIO 19H'),
  ('Anaïs Rodriguez Bastiani', 'JUEVES MEDIO 19H'),
  ('Maria Moreno', 'JUEVES MEDIO 19H'),
  ('Peter Simpson', 'JUEVES AVANZADO 19H'),
  ('Carolina Sánchez perez', 'JUEVES AVANZADO 19H'),
  ('Isabel Simpson', 'JUEVES AVANZADO 19H'),
  ('Saul Tabasco Alonso', 'JUEVES AVANZADO 19H'),
  ('Celia Pereda Lostau', 'JUEVES AVANZADO 19H'),
  ('JAIME CONTRERAS LOPEZ', 'JUEVES AVANZADO 19H'),
  ('Hugo Simon Perez', 'JUEVES AVANZADO 19H'),
  ('Daniel Bárez Carballo', 'JUEVES AVANZADO 19H'),
  ('Luis Cerrillo Arias', 'JUEVES BAJO 20H'),
  ('Paloma Canales Espi', 'JUEVES BAJO 20H'),
  ('Andreína Maris', 'JUEVES BAJO 20H'),
  ('ana Carmen Pozo Pascual', 'JUEVES BAJO 20H'),
  ('José Luis Plaza Canga-Arguelles', 'JUEVES BAJO 20H'),
  ('Jaime Garrido Mariscal', 'JUEVES BAJO 20H'),
  ('Sergio de la Camara Sanz', 'JUEVES BAJO 20H'),
  ('Daniel Puche Hontanilla', 'JUEVES BAJO 20H'),
  ('Sonia Andres Conde', 'JUEVES BAJO 20H'),
  ('Sandra Machado Henares', 'JUEVES BAJO 20H'),
  ('Daniel Castro Márquez', 'JUEVES MEDIO 20H'),
  ('Paula Holguín Segovia', 'JUEVES MEDIO 20H'),
  ('juan aparicio Manzano', 'JUEVES MEDIO 20H'),
  ('Miguel Ángel Pedrosa Hiruelas', 'JUEVES MEDIO 20H'),
  ('Manuel Arenas Mateos', 'JUEVES MEDIO 20H'),
  ('Sonia Cesteros Garcia', 'JUEVES MEDIO 20H'),
  ('Jaime González Marcos', 'JUEVES MEDIO 20H'),
  ('Nimai Pandit Delis Rojas', 'JUEVES AVANZADO 20H'),
  ('David Fernández Álvarez', 'JUEVES AVANZADO 20H'),
  ('Diego Gil  Gordillo', 'JUEVES AVANZADO 20H'),
  ('Sergio San Fruto Conde', 'JUEVES AVANZADO 20H'),
  ('Alejandro Sanchez Martin', 'JUEVES AVANZADO 20H'),
  ('Martina Pous Ribagorda', 'JUEVES AVANZADO 20H'),
  ('ALICIA DELGADO PRIETO', 'JUEVES AVANZADO 20H'),
  ('Julia Millo Bretin', 'JUEVES AVANZADO 20H'),
  ('JAVIER CERDEIRA MELERO', 'JUEVES AVANZADO 20H'),
  ('Angelina De La Rua Mazza', 'ATLETISMO 1A LUNES'),
  ('Carlos Pereda Lostau', 'ATLETISMO 1A LUNES'),
  ('david de lorenzo Macías', 'ATLETISMO 1A LUNES'),
  ('Leon Strumbo Wilson', 'ATLETISMO 1A LUNES'),
  ('Lola López Moreno', 'ATLETISMO 1A LUNES'),
  ('María Simpson', 'ATLETISMO 1A LUNES'),
  ('Mario tejero maria', 'ATLETISMO 1A LUNES'),
  ('Martín Arribas del Amo', 'ATLETISMO 1A LUNES'),
  ('Quique López Moreno', 'ATLETISMO 1A LUNES'),
  ('Rosa Strumbo Wilson', 'ATLETISMO 1A LUNES'),
  ('Saúl Niño Negreira', 'ATLETISMO 1A LUNES'),
  ('TULIO RUIZ DELGADO', 'ATLETISMO 1A LUNES'),
  ('Vega Delgado de Felix', 'ATLETISMO 1A LUNES'),
  ('Lucia Simon Perez', 'ATLETISMO 1B LUNES'),
  ('Noa Lopez Herrera', 'ATLETISMO 1B LUNES'),
  ('Maria Moreno', 'ATLETISMO 1B LUNES'),
  ('Jorge del Río Serrano', 'ATLETISMO 1B LUNES'),
  ('Jara Lahera Sánchez', 'ATLETISMO 1B LUNES'),
  ('Guillermo González Serralta', 'ATLETISMO 2 LUNES'),
  ('JAIME CONTRERAS LOPEZ', 'ATLETISMO 2 LUNES'),
  ('María Caballero de la Cruz', 'ATLETISMO 2 LUNES'),
  ('Julia Millo Bretin', 'ATLETISMO 2 LUNES'),
  ('Anaïs Rodriguez Bastiani', 'ATLETISMO 2 LUNES'),
  ('Hugo Jiménez Ocaña', 'ATLETISMO 2 LUNES'),
  ('Celia Pereda Lostau', 'ATLETISMO 2 LUNES'),
  ('Isabel Simpson', 'ATLETISMO 2 LUNES'),
  ('Saul Tabasco Alonso', 'ATLETISMO 2 LUNES'),
  ('Daniel Bárez Carballo', 'ATLETISMO 2 LUNES'),
  ('ALICIA DELGADO PRIETO', 'ATLETISMO 2 LUNES'),
  ('Diego Gil  Gordillo', 'ATLETISMO 2 LUNES'),
  ('Martina Pous Ribagorda', 'ATLETISMO 2 LUNES'),
  ('Hugo Simon Perez', 'ATLETISMO 2 LUNES'),
  ('Fernando Niño Martínez', 'ATLETISMO 3 LUNES'),
  ('Paloma Rojas Vaquero', 'ATLETISMO 3 LUNES'),
  ('Elena Perez Ruiz', 'ATLETISMO 3 LUNES'),
  ('David del Río Pascual', 'ATLETISMO 3 LUNES'),
  ('Rosa Negreira Hernandez', 'ATLETISMO 3 LUNES'),
  ('Lara de Diego Gustin', 'ATLETISMO 3 LUNES'),
  ('Carolina Sánchez perez', 'ATLETISMO 3 LUNES'),
  ('Luis Miguel Blázquez Iznaol', 'ATLETISMO 3 LUNES'),
  ('Peter Simpson', 'ATLETISMO 3 LUNES'),
  ('Hector Javier de la calle Gonzalez', 'ATLETISMO 3 LUNES'),
  ('Paloma Canales Espi', 'ATLETISMO 3 LUNES'),
  ('Sonia Andres Conde', 'ATLETISMO 3 LUNES'),
  ('Daniel Puche Hontanilla', 'ATLETISMO 3 LUNES'),
  ('Jaime Garrido Mariscal', 'ATLETISMO 3 LUNES'),
  ('Sergio de la Camara Sanz', 'ATLETISMO 3 LUNES'),
  ('Luis Cerrillo Arias', 'ATLETISMO 3 LUNES'),
  ('ana Carmen Pozo Pascual', 'ATLETISMO 3 LUNES'),
  ('Andreína Maris', 'ATLETISMO 3 LUNES'),
  ('Miguel Ángel Pedrosa Hiruelas', 'ATLETISMO 3 LUNES'),
  ('JAVIER CERDEIRA MELERO', 'ATLETISMO 3 LUNES'),
  ('Nimai Pandit Delis Rojas', 'ATLETISMO 3 LUNES'),
  ('Paula Holguín Segovia', 'ATLETISMO 3 LUNES'),
  ('Daniel Castro Márquez', 'ATLETISMO 3 LUNES'),
  ('Sandra Machado Henares', 'ATLETISMO 3 LUNES'),
  ('Jaime González Marcos', 'ATLETISMO 3 LUNES'),
  ('David Fernández Álvarez', 'ATLETISMO 3 LUNES'),
  ('Alejandro Sanchez Martin', 'ATLETISMO 3 LUNES'),
  ('Ramón Cabañas Giron', 'ATLETISMO 3 LUNES')
),
grupos_norm as (
  select g.id as grupo_id,
    regexp_replace(unaccent(lower(trim(g.nombre))), '\s+', ' ', 'g') as clave
  from grupos g
),
roster_con_grupo as (
  select r.nombre,
    regexp_replace(unaccent(lower(trim(r.grupo_nombre))), '\s+', ' ', 'g') as clave
  from roster r
),
esperados as (
  select distinct nombre from roster
),
existentes as (
  select d.id, d.nombre from deportistas d
  where unaccent(lower(d.nombre)) in (select unaccent(lower(nombre)) from esperados)
)
insert into deportista_grupo (deportista_id, grupo_id)
select distinct e.id, gn.grupo_id
from roster_con_grupo rc
join existentes e on unaccent(lower(e.nombre)) = unaccent(lower(rc.nombre))
join grupos_norm gn on gn.clave = rc.clave
on conflict do nothing;

-- Comprobación: cuántos hay ahora en cada uno de los 16 grupos
select g.nombre, count(dg.deportista_id) as num_deportistas
from grupos g
left join deportista_grupo dg on dg.grupo_id = g.id
where unaccent(lower(g.nombre)) in (
  'martes peques 19h','martes medio 19h','martes avanzado 19h','martes bajo 20h',
  'martes medio 20h','martes avanzado 20h','jueves peques 19h','jueves medio 19h',
  'jueves avanzado 19h','jueves bajo 20h','jueves medio 20h','jueves avanzado 20h',
  'atletismo 1a lunes','atletismo 1b lunes','atletismo 2 lunes','atletismo 3 lunes'
)
group by g.nombre
order by g.nombre;
