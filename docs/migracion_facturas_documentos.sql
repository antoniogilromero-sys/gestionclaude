-- =====================================================================
--  Archivo de facturas subidas (PDF/imagen) dentro de /facturas
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Mismo patrón que pedidos/jornadas: bucket privado de Storage + tabla
-- de metadatos, solo director. Es un archivo aparte de las facturas que
-- emite la app (tabla `facturas`, que no se toca): sirve para guardar
-- facturas recibidas, escaneadas o emitidas fuera de la app.

insert into storage.buckets (id, name, public)
values ('facturas-documentos', 'facturas-documentos', false)
on conflict (id) do nothing;

drop policy if exists p_storage_facturas_leer on storage.objects;
create policy p_storage_facturas_leer on storage.objects
  for select using (bucket_id = 'facturas-documentos' and es_director());

drop policy if exists p_storage_facturas_subir on storage.objects;
create policy p_storage_facturas_subir on storage.objects
  for insert with check (bucket_id = 'facturas-documentos' and es_director());

drop policy if exists p_storage_facturas_borrar on storage.objects;
create policy p_storage_facturas_borrar on storage.objects
  for delete using (bucket_id = 'facturas-documentos' and es_director());

create table if not exists facturas_documentos (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  storage_path text not null,
  subido_por   uuid references perfiles (id),
  creado_en    timestamptz not null default now()
);

alter table facturas_documentos enable row level security;

drop policy if exists p_facturas_doc_leer on facturas_documentos;
create policy p_facturas_doc_leer on facturas_documentos
  for select using (es_director());

drop policy if exists p_facturas_doc_crear on facturas_documentos;
create policy p_facturas_doc_crear on facturas_documentos
  for insert with check (es_director());

drop policy if exists p_facturas_doc_borrar on facturas_documentos;
create policy p_facturas_doc_borrar on facturas_documentos
  for delete using (es_director());
