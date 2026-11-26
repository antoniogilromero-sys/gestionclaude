-- Administración > Organización Duatlón: cuaderno de la organización del
-- I Duatlón Cross Escolar Alpedrete (28/02/2027). Cada entrada puede llevar
-- una nota, un enlace y/o un archivo, y marcarse como tarea (pendiente/hecha).
-- Solo el director.
--
-- Pegar entero en Supabase > SQL Editor > Run. Se puede repetir sin duplicar.

create table if not exists duatlon_items (
  id             bigint generated always as identity primary key,
  categoria      text not null,
  titulo         text not null,
  nota           text,
  enlace         text,
  archivo_ruta   text,   -- ruta dentro del almacén privado "duatlon"
  archivo_nombre text,
  es_tarea       boolean not null default false,
  hecho          boolean not null default false,
  creado_por     uuid references perfiles (id),
  creado_en      timestamptz not null default now()
);

alter table duatlon_items enable row level security;
drop policy if exists p_duatlon_items on duatlon_items;
create policy p_duatlon_items on duatlon_items
  for all using (es_director()) with check (es_director());

-- Almacén privado para los archivos que se suban (PDF, fotos, Excel...).
insert into storage.buckets (id, name, public)
values ('duatlon', 'duatlon', false)
on conflict (id) do nothing;

drop policy if exists p_duatlon_archivos on storage.objects;
create policy p_duatlon_archivos on storage.objects
  for all to authenticated
  using (bucket_id = 'duatlon' and es_director())
  with check (bucket_id = 'duatlon' and es_director());

-- Contenido inicial: los documentos ya hechos y las tareas que, según el
-- informe de material, corresponden a la organización. Se puede borrar o
-- cambiar desde la app.
insert into duatlon_items (categoria, titulo, nota, enlace, es_tarea)
select v.categoria, v.titulo, v.nota, v.enlace, v.es_tarea
from (values
  ('Circuitos',                'Dosier de la prueba',                          'Horarios, distancias, circuitos y zonas.', 'https://claude.ai/artifact/VVgtVuoyHQu5o818zjWiri', false),
  ('Permisos y Ayuntamiento',  'Informe de solicitud de material',             'Para la Concejalía de Deportes.',          'https://claude.ai/artifact/VRWGneQN8aR7BeivsYMC7q', false),
  ('Patrocinadores',           'Dosier de patrocinio',                         'Para entregar en mano a las empresas.',    'https://claude.ai/artifact/QeLbYF41jLCr8DM4P9fvFt', false),
  ('Patrocinadores',           'Relación de empresas a contactar',             'Las que ya teníamos y las nuevas.',        'https://claude.ai/artifact/YRB2DRbWTVh75uLRhonZYL', false),
  ('Permisos y Ayuntamiento',  'Presentar la solicitud de material al Ayuntamiento', null, null, true),
  ('Permisos y Ayuntamiento',  'Permisos, autorizaciones y servicios municipales',   null, null, true),
  ('Material',                 'Contratar ambulancia medicalizada',                  'Obligatoria.', null, true),
  ('Permisos y Ayuntamiento',  'Seguro de responsabilidad civil',                    null, null, true),
  ('Voluntarios',              'Reunir 35-40 voluntarios y repartir puestos',        'Recorridos y avituallamiento.', null, true),
  ('Material',                 'Avituallamiento líquido y sólido',                   null, null, true),
  ('Patrocinadores',           'Visitar a las empresas con el dosier',               'Empezar por Coren Dental (renovar).', null, true)
) as v(categoria, titulo, nota, enlace, es_tarea)
where not exists (select 1 from duatlon_items d where d.titulo = v.titulo);
