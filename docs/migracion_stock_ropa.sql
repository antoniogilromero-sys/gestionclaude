-- =====================================================================
--  Stock de camisetas y material del club
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Distinto de `pedidos`: esa tabla es un encargo concreto para un
-- deportista concreto al proveedor. Esta es el inventario que el club
-- ya tiene físicamente guardado (sobrantes, tallas de sobra para
-- imprevistos, altas de última hora...), sin ligar a ningún deportista.
-- Solo el director lo gestiona, igual que pedidos.

create table stock_ropa (
  id           bigint generated always as identity primary key,
  tipo         text not null check (tipo in ('algodon', 'tecnica')),
  genero       text not null check (genero in ('hombre', 'mujer', 'unisex')),
  talla        text not null,
  cantidad     int  not null default 0 check (cantidad >= 0),
  notas        text,
  actualizado_por uuid references perfiles (id),
  actualizado_en  timestamptz not null default now()
);

alter table stock_ropa enable row level security;

create policy p_stock_ropa_leer      on stock_ropa for select using (es_director());
create policy p_stock_ropa_crear     on stock_ropa for insert with check (es_director());
create policy p_stock_ropa_actualizar on stock_ropa for update using (es_director()) with check (es_director());
create policy p_stock_ropa_borrar    on stock_ropa for delete using (es_director());
