-- Sincroniza los 13 grupos de natación con la pestaña "Hoja 3" del Google
-- Sheet de inscripciones (mismo roster de siempre, revisado 20/08/2026).
-- Es seguro ejecutar esto varias veces: no duplica deportistas ni
-- vínculos ya existentes, solo añade lo que falte.

with roster(nombre, grupo_nombre) as (
  values
    ('Lorenzo Bernal Carpio', 'Martes Peques 19h'),
    ('Leon Strumbo Wilson', 'Martes Peques 19h'),
    ('Lola López Moreno', 'Martes Peques 19h'),
    ('Carlos Pereda Lostau', 'Martes Peques 19h'),
    ('Tulio Ruiz Delgado', 'Martes Peques 19h'),
    ('Luna González Serralta', 'Martes Peques 19h'),
    ('Rosa Strumbo Wilson', 'Martes Peques 19h'),
    ('Alba Marfil Gómez', 'Martes Peques 19h'),
    ('Bruno Pasamontes Alarcon', 'Martes Peques 19h'),
    ('Martín Arribas del Amo', 'Martes Peques 19h'),
    ('María Simpson', 'Martes Peques 19h'),
    ('Isabella D''Addiego', 'Martes Peques 19h'),
    ('Quique López Moreno', 'Martes Peques 19h'),

    ('Fernando Bernal Salve', 'Martes Medio 19h'),
    ('Fernando Niño Martínez', 'Martes Medio 19h'),
    ('Alba García Palacios', 'Martes Medio 19h'),
    ('Hugo Jiménez Ocaña', 'Martes Medio 19h'),
    ('Jorge del Río Serrano', 'Martes Medio 19h'),
    ('Ramón Hernando', 'Martes Medio 19h'),
    ('Jara Lahera Sánchez', 'Martes Medio 19h'),
    ('Lucia Simon Perez', 'Martes Medio 19h'),
    ('Hugo Ramos Gonzalez', 'Martes Medio 19h'),
    ('Airam Giuseppi Perales Mayta', 'Martes Medio 19h'),
    ('Sarasvati Delis Rojas', 'Martes Medio 19h'),
    ('Guillermo González Serralta', 'Martes Medio 19h'),
    ('Elena Perez Ruiz', 'Martes Medio 19h'),
    ('Paloma Rojas Vaquero', 'Martes Medio 19h'),
    ('David del Río Pascual', 'Martes Medio 19h'),
    ('Teresa Serralta Gely', 'Martes Medio 19h'),
    ('Raquel Gómez García', 'Martes Medio 19h'),

    ('Luis Miguel Blázquez Iznaol', 'Martes Avanzado 19h'),
    ('Celia Pereda Lostau', 'Martes Avanzado 19h'),
    ('Hugo Simon Perez', 'Martes Avanzado 19h'),
    ('Gorka Hernando Muñoz', 'Martes Avanzado 19h'),
    ('Saul Tabasco Alonso', 'Martes Avanzado 19h'),
    ('Isabel Simpson', 'Martes Avanzado 19h'),
    ('Daniel Bárez Carballo', 'Martes Avanzado 19h'),
    ('Jaime Contreras Lopez', 'Martes Avanzado 19h'),
    ('Alicia Delgado Prieto', 'Martes Avanzado 19h'),
    ('Lucas Bernardo Strumbo', 'Martes Avanzado 19h'),
    ('Peter Simpson', 'Martes Avanzado 19h'),
    ('Carolina Sánchez Perez', 'Martes Avanzado 19h'),

    ('Joaquín Millo Acedo', 'Martes Bajo 20h'),
    ('Luis Cerrillo Arias', 'Martes Bajo 20h'),
    ('Daniel Puche Hontanilla', 'Martes Bajo 20h'),
    ('Paloma Canales Espi', 'Martes Bajo 20h'),
    ('Andreína Maris', 'Martes Bajo 20h'),
    ('Rafael Caballero de la Cruz', 'Martes Bajo 20h'),
    ('Ana Carmen Pozo Pascual', 'Martes Bajo 20h'),
    ('Hector Javier de la Calle Gonzalez', 'Martes Bajo 20h'),
    ('Sonia Andres Conde', 'Martes Bajo 20h'),

    ('Sandra Machado Henares', 'Martes Medio 20h'),
    ('Javier Cerdeira Melero', 'Martes Medio 20h'),
    ('Paula Holguín Segovia', 'Martes Medio 20h'),
    ('Sonia Cesteros Garcia', 'Martes Medio 20h'),
    ('Daniel Castro Márquez', 'Martes Medio 20h'),
    ('Manuel Arenas Mateos', 'Martes Medio 20h'),
    ('Jaime González Marcos', 'Martes Medio 20h'),
    ('Miguel Ángel Pedrosa Hiruelas', 'Martes Medio 20h'),
    ('Juan Aparicio Manzano', 'Martes Medio 20h'),
    ('Nimai Pandit Delis Rojas', 'Martes Medio 20h'),
    ('Noemí de la Cuerda', 'Martes Medio 20h'),

    ('María Caballero de la Cruz', 'Martes Avanzado 20h'),
    ('Martina Pous Ribagorda', 'Martes Avanzado 20h'),
    ('Julia Millo Bretin', 'Martes Avanzado 20h'),
    ('Diego Gil Gordillo', 'Martes Avanzado 20h'),
    ('Sergio San Fruto Conde', 'Martes Avanzado 20h'),
    ('Hugo Martin Rodao', 'Martes Avanzado 20h'),
    ('Alejandro Sanchez Martin', 'Martes Avanzado 20h'),
    ('David Fernández Álvarez', 'Martes Avanzado 20h'),

    ('Carlos Pereda Lostau', 'Jueves Peques 19h'),
    ('Luna González Serralta', 'Jueves Peques 19h'),
    ('Saúl Niño Negreira', 'Jueves Peques 19h'),
    ('Alba Marfil Gómez', 'Jueves Peques 19h'),
    ('Martín Arribas del Amo', 'Jueves Peques 19h'),
    ('María Simpson', 'Jueves Peques 19h'),

    ('Hugo Jiménez Ocaña', 'Jueves Medio 19h'),
    ('Noa Lopez Herrera', 'Jueves Medio 19h'),
    ('Jara Lahera Sánchez', 'Jueves Medio 19h'),
    ('Lucia Simon Perez', 'Jueves Medio 19h'),
    ('Hugo Ramos Gonzalez', 'Jueves Medio 19h'),
    ('Airam Giuseppi Perales Mayta', 'Jueves Medio 19h'),
    ('Sarasvati Delis Rojas', 'Jueves Medio 19h'),
    ('Guillermo González Serralta', 'Jueves Medio 19h'),
    ('Elena Perez Ruiz', 'Jueves Medio 19h'),
    ('Anaïs Rodriguez Bastiani', 'Jueves Medio 19h'),
    ('Ramón Hernando', 'Jueves Medio 19h'),
    ('Paloma Rojas Vaquero', 'Jueves Medio 19h'),
    ('Lara de Diego Gustin', 'Jueves Medio 19h'),
    ('Teresa Serralta Gely', 'Jueves Medio 19h'),
    ('Raquel Gómez García', 'Jueves Medio 19h'),
    ('Marta Gonzalez Martin', 'Jueves Medio 19h'),
    ('Rosa Negreira Hernandez', 'Jueves Medio 19h'),

    ('Celia Pereda Lostau', 'Jueves Avanzado 19h'),
    ('Gorka Hernando Muñoz', 'Jueves Avanzado 19h'),
    ('Saul Tabasco Alonso', 'Jueves Avanzado 19h'),
    ('Isabel Simpson', 'Jueves Avanzado 19h'),
    ('Daniel Bárez Carballo', 'Jueves Avanzado 19h'),
    ('Jaime Contreras Lopez', 'Jueves Avanzado 19h'),
    ('Alicia Delgado Prieto', 'Jueves Avanzado 19h'),
    ('Peter Simpson', 'Jueves Avanzado 19h'),
    ('Carolina Sánchez Perez', 'Jueves Avanzado 19h'),
    ('Hugo Simon Perez', 'Jueves Avanzado 19h'),

    ('Ana Carmen Pozo Pascual', 'Jueves Bajo 20h'),
    ('Rafael Caballero de la Cruz', 'Jueves Bajo 20h'),
    ('Andreína Maris', 'Jueves Bajo 20h'),
    ('Paloma Canales Espi', 'Jueves Bajo 20h'),
    ('Sonia Andres Conde', 'Jueves Bajo 20h'),
    ('José Luis Plaza Canga-Arguelles', 'Jueves Bajo 20h'),
    ('Daniel Puche Hontanilla', 'Jueves Bajo 20h'),
    ('Luis Cerrillo Arias', 'Jueves Bajo 20h'),
    ('Joaquín Millo Acedo', 'Jueves Bajo 20h'),
    ('Sandra Machado Henares', 'Jueves Bajo 20h'),

    ('Noemí de la Cuerda', 'Jueves Medio 20h'),
    ('Juan Aparicio Manzano', 'Jueves Medio 20h'),
    ('Miguel Ángel Pedrosa Hiruelas', 'Jueves Medio 20h'),
    ('José Luis Martín-Velasco Gutiérrez', 'Jueves Medio 20h'),
    ('Jaime González Marcos', 'Jueves Medio 20h'),
    ('Manuel Arenas Mateos', 'Jueves Medio 20h'),
    ('Sonia Cesteros Garcia', 'Jueves Medio 20h'),
    ('Daniel Castro Márquez', 'Jueves Medio 20h'),
    ('Paula Holguín Segovia', 'Jueves Medio 20h'),
    ('Alejandro Martín-Velasco Suárez', 'Jueves Medio 20h'),
    ('Javier Cerdeira Melero', 'Jueves Medio 20h'),
    ('Nimai Pandit Delis Rojas', 'Jueves Medio 20h'),

    ('Alejandro Sanchez Martin', 'Jueves Avanzado 20h'),
    ('Hugo Martin Rodao', 'Jueves Avanzado 20h'),
    ('Sergio San Fruto Conde', 'Jueves Avanzado 20h'),
    ('Diego Gil Gordillo', 'Jueves Avanzado 20h'),
    ('Julia Millo Bretin', 'Jueves Avanzado 20h'),
    ('Martina Pous Ribagorda', 'Jueves Avanzado 20h'),
    ('María Caballero de la Cruz', 'Jueves Avanzado 20h'),
    ('Nimai Pandit Delis Rojas', 'Jueves Avanzado 20h'),
    ('David Fernández Álvarez', 'Jueves Avanzado 20h'),

    ('Lola López Moreno', 'Jueves 18h'),
    ('Quique López Moreno', 'Jueves 18h'),
    ('Vega Delgado de Felix', 'Jueves 18h'),
    ('David de Lorenzo Macías', 'Jueves 18h'),
    ('Mario Tejero María', 'Jueves 18h'),
    ('Tulio Ruiz Delgado', 'Jueves 18h'),
    ('Angelina De La Rua Mazza', 'Jueves 18h'),
    ('Isabella D''Addiego', 'Jueves 18h')
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
)
insert into deportista_grupo (deportista_id, grupo_id)
select distinct t.id, g.id
from roster r
join todos t on unaccent(lower(t.nombre)) = unaccent(lower(r.nombre))
join grupos g on unaccent(lower(g.nombre)) = unaccent(lower(r.grupo_nombre))
on conflict do nothing;

-- Comprueba cuántos deportistas nuevos entraron y cuántos vínculos hay
-- ahora en total, para ver el efecto de este sync:
select count(*) as deportistas_totales from deportistas;
select count(*) as vinculos_grupo_totales from deportista_grupo;
