-- =====================================================================
--  Inscripciones (datos personales del Google Forms de alta de socios)
--  Pegar en Supabase > SQL Editor > Run (una sola vez).
--
--  Esta es la ÚNICA tabla del proyecto con datos personales sensibles
--  (DNI, domicilio, teléfono, fecha de nacimiento de menores). Antón
--  decidió tenerla a pesar de que el diseño original de la app era "sin
--  datos personales" — con la condición explícita de que SOLO el
--  director la vea. No se toca la política de deportistas ni de
--  resultados: esta tabla vive aparte y con su propio candado.
--
--  El texto de protección de datos y de derechos de imagen se guarda tal
--  cual lo marcó la familia en el formulario (no un simple sí/no), para
--  poder demostrar más adelante qué consintió cada uno exactamente.
-- =====================================================================

create table inscripciones (
  id                  bigint generated always as identity primary key,
  deportista_id       bigint references deportistas (id) on delete set null,
  email               text not null,
  nombre_completo     text not null,
  dni                 text,
  fecha_nacimiento    date,
  domicilio           text,
  talla_camiseta      text,
  dias_piscina        text,
  proteccion_datos    text,
  derechos_imagen     text,
  telefono            text,
  creado_en           timestamptz not null default now()
);

alter table inscripciones enable row level security;

-- Solo el director. Ni siquiera los entrenadores aprobados entran aquí.
create policy p_inscripciones_leer   on inscripciones for select using (es_director());
create policy p_inscripciones_editar on inscripciones for update using (es_director()) with check (es_director());
create policy p_inscripciones_borrar on inscripciones for delete using (es_director());

-- Sin política de insert: las filas las crea el webhook del Google Forms
-- usando la clave de servicio (service_role), que salta el RLS. Nadie
-- puede insertar aquí desde la propia app ni con la clave pública.
