-- Histórico de documentos de pedido (los PDF que se mandan al proveedor de
-- ropa cada vez que se hace un pedido de tallas), guardados dentro de
-- /pedidos. Antes no había ningún sitio en la app para guardar archivos —
-- esto añade un bucket de Storage privado + una tabla con el nombre y la
-- ruta de cada documento subido.

insert into storage.buckets (id, name, public)
values ('pedidos-documentos', 'pedidos-documentos', false)
on conflict (id) do nothing;

-- Solo el director puede leer/subir/borrar en este bucket — mismo criterio
-- que el resto de /pedidos.
drop policy if exists p_storage_pedidos_leer on storage.objects;
create policy p_storage_pedidos_leer on storage.objects
  for select using (bucket_id = 'pedidos-documentos' and es_director());

drop policy if exists p_storage_pedidos_subir on storage.objects;
create policy p_storage_pedidos_subir on storage.objects
  for insert with check (bucket_id = 'pedidos-documentos' and es_director());

drop policy if exists p_storage_pedidos_borrar on storage.objects;
create policy p_storage_pedidos_borrar on storage.objects
  for delete using (bucket_id = 'pedidos-documentos' and es_director());

create table if not exists pedidos_documentos (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  storage_path text not null,
  subido_por   uuid references perfiles (id),
  creado_en    timestamptz not null default now()
);

alter table pedidos_documentos enable row level security;

drop policy if exists p_pedidos_doc_leer on pedidos_documentos;
create policy p_pedidos_doc_leer on pedidos_documentos
  for select using (es_director());

drop policy if exists p_pedidos_doc_crear on pedidos_documentos;
create policy p_pedidos_doc_crear on pedidos_documentos
  for insert with check (es_director());

drop policy if exists p_pedidos_doc_borrar on pedidos_documentos;
create policy p_pedidos_doc_borrar on pedidos_documentos
  for delete using (es_director());
