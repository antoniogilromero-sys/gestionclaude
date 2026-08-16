-- Histórico de documentos de /jornadas (ej. el listado de colegios de la
-- zona con teléfono/dirección/email, para tenerlo a mano al organizar
-- jornadas de promoción). Mismo patrón que
-- docs/migracion_pedidos_documentos.sql — bucket privado + tabla de
-- metadatos, solo director.

insert into storage.buckets (id, name, public)
values ('jornadas-documentos', 'jornadas-documentos', false)
on conflict (id) do nothing;

drop policy if exists p_storage_jornadas_leer on storage.objects;
create policy p_storage_jornadas_leer on storage.objects
  for select using (bucket_id = 'jornadas-documentos' and es_director());

drop policy if exists p_storage_jornadas_subir on storage.objects;
create policy p_storage_jornadas_subir on storage.objects
  for insert with check (bucket_id = 'jornadas-documentos' and es_director());

drop policy if exists p_storage_jornadas_borrar on storage.objects;
create policy p_storage_jornadas_borrar on storage.objects
  for delete using (bucket_id = 'jornadas-documentos' and es_director());

create table if not exists jornadas_documentos (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  storage_path text not null,
  subido_por   uuid references perfiles (id),
  creado_en    timestamptz not null default now()
);

alter table jornadas_documentos enable row level security;

drop policy if exists p_jornadas_doc_leer on jornadas_documentos;
create policy p_jornadas_doc_leer on jornadas_documentos
  for select using (es_director());

drop policy if exists p_jornadas_doc_crear on jornadas_documentos;
create policy p_jornadas_doc_crear on jornadas_documentos
  for insert with check (es_director());

drop policy if exists p_jornadas_doc_borrar on jornadas_documentos;
create policy p_jornadas_doc_borrar on jornadas_documentos
  for delete using (es_director());
