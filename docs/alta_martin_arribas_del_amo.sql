-- =====================================================================
--  Alta / actualización de Martín Arribas del Amo
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Idempotente: si ya existe (que es lo más probable — este nombre ya
-- salía en la carga histórica de inscripciones y en la sincronización
-- de grupos de natación/atletismo de este mismo mes), no duplica nada,
-- solo actualiza sus datos de contacto y se asegura de que está en sus
-- grupos.
--
-- Grupos asignados: Martes Peques 19h, Jueves Peques 19h y Atletismo 1A
-- Lunes — son los que ya tenía en la hoja de grupos que sincronizamos
-- hace poco (la fila que me diste solo decía "MARTES, JUEVES" sin
-- especificar el nivel; he usado el mismo nivel — Peques — que ya
-- estaba en la hoja de grupos. Si su nivel ha cambiado, dímelo y lo
-- corrijo).

-- 1) Deportista (sin datos personales — esos solo van en inscripciones)
insert into deportistas (nombre, activo)
select 'Martín Arribas del Amo', true
where not exists (
  select 1 from deportistas
  where unaccent(lower(trim(nombre))) = unaccent(lower(trim('Martín Arribas del Amo')))
);

-- 2) Vincular a sus grupos
insert into deportista_grupo (deportista_id, grupo_id)
select d.id, g.id
from deportistas d, grupos g
where unaccent(lower(trim(d.nombre))) = unaccent(lower(trim('Martín Arribas del Amo')))
  and unaccent(lower(g.nombre)) in (
    unaccent(lower('Martes Peques 19h')),
    unaccent(lower('Jueves Peques 19h')),
    unaccent(lower('Atletismo 1A Lunes'))
  )
on conflict do nothing;

-- 3) Inscripción con sus datos de contacto (actualiza si ya existe, la
--    crea si no)
with datos as (
  select
    'diegoarribas1978@gmail.com'::text as email,
    'Martín Arribas del Amo'::text as nombre_completo,
    '05732079L'::text as dni,
    '2015-06-13'::date as fecha_nacimiento,
    'c/ San Sebastián nº24 Bloque 1 1º C El Boalo Madrid'::text as domicilio,
    'S'::text as talla_camiseta,
    'MARTES, JUEVES'::text as dias_piscina,
    'ENTREGADA'::text as proteccion_datos,
    'ENTREGADA'::text as derechos_imagen,
    '627504384, 647774842'::text as telefono,
    'lore.amo.perez@gmail.com'::text as email2
),
actualizado as (
  update inscripciones i
  set email = d.email,
      dni = d.dni,
      fecha_nacimiento = d.fecha_nacimiento,
      domicilio = d.domicilio,
      talla_camiseta = d.talla_camiseta,
      dias_piscina = d.dias_piscina,
      proteccion_datos = d.proteccion_datos,
      derechos_imagen = d.derechos_imagen,
      telefono = d.telefono,
      email2 = d.email2
  from datos d
  where unaccent(lower(trim(i.nombre_completo))) = unaccent(lower(trim(d.nombre_completo)))
  returning i.id
)
insert into inscripciones (email, nombre_completo, dni, fecha_nacimiento, domicilio,
  talla_camiseta, dias_piscina, proteccion_datos, derechos_imagen, telefono, email2)
select email, nombre_completo, dni, fecha_nacimiento, domicilio,
  talla_camiseta, dias_piscina, proteccion_datos, derechos_imagen, telefono, email2
from datos
where not exists (select 1 from actualizado);

-- 4) Vincula la inscripción con el deportista (para que salga "Vinculada")
update inscripciones i
set deportista_id = deportista_id_o_alta(i.nombre_completo)
where unaccent(lower(trim(i.nombre_completo))) = unaccent(lower(trim('Martín Arribas del Amo')));

-- Comprobación
select d.id, d.nombre, d.activo,
  (select string_agg(g.nombre, ', ') from deportista_grupo dg join grupos g on g.id = dg.grupo_id where dg.deportista_id = d.id) as grupos
from deportistas d
where unaccent(lower(d.nombre)) like '%martin%arribas%amo%';

select id, nombre_completo, email, email2, telefono, deportista_id
from inscripciones
where unaccent(lower(nombre_completo)) like '%martin%arribas%amo%';
