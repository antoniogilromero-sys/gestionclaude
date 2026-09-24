-- =====================================================================
--  Documentos de una lesión (informes médicos, radiografías, altas...)
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Mismo patrón que docs/migracion_pedidos_documentos.sql y
-- docs/migracion_jornadas_documentos.sql: bucket privado de Storage +
-- tabla de metadatos, el archivo se sube directo desde el navegador
-- (nunca por una server action) y se ve con una URL firmada que caduca
-- a los 2 minutos.
--
-- Diferencia con esos dos: aquí cada documento va ligado a una lesión
-- concreta (columna lesion_id), no es un histórico suelto — y la
-- lectura es para director y entrenador (aprobado()), no solo
-- director, porque el entrenador necesita poder ver por ejemplo el
-- informe del fisio. Subir y borrar sigue siendo solo del director,
-- igual que el resto de /lesionados.

insert into storage.buckets (id, name, public)
values ('lesiones-documentos', 'lesiones-documentos', false)
on conflict (id) do nothing;

drop policy if exists p_storage_lesiones_leer on storage.objects;
create policy p_storage_lesiones_leer on storage.objects
  for select using (bucket_id = 'lesiones-documentos' and aprobado());

drop policy if exists p_storage_lesiones_subir on storage.objects;
create policy p_storage_lesiones_subir on storage.objects
  for insert with check (bucket_id = 'lesiones-documentos' and es_director());

drop policy if exists p_storage_lesiones_borrar on storage.objects;
create policy p_storage_lesiones_borrar on storage.objects
  for delete using (bucket_id = 'lesiones-documentos' and es_director());

create table if not exists lesion_documentos (
  id           bigint generated always as identity primary key,
  lesion_id    bigint not null references lesiones (id) on delete cascade,
  nombre       text not null,
  storage_path text not null,
  subido_por   uuid references perfiles (id),
  creado_en    timestamptz not null default now()
);

create index on lesion_documentos (lesion_id);

alter table lesion_documentos enable row level security;

drop policy if exists p_lesiondoc_leer on lesion_documentos;
create policy p_lesiondoc_leer on lesion_documentos
  for select using (aprobado());

drop policy if exists p_lesiondoc_crear on lesion_documentos;
create policy p_lesiondoc_crear on lesion_documentos
  for insert with check (es_director());

drop policy if exists p_lesiondoc_borrar on lesion_documentos;
create policy p_lesiondoc_borrar on lesion_documentos
  for delete using (es_director());
