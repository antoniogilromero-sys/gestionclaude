-- =====================================================================
--  Pedidos de camisetas y sudaderas del club
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
--
--  A diferencia de facturas, esto NO es un documento fiscal: se puede
--  borrar si alguien se equivoca de talla, sin necesidad de una
--  "rectificativa". Solo el director gestiona este apartado.
-- =====================================================================

create table pedidos (
  id            bigint generated always as identity primary key,
  deportista_id bigint not null references deportistas (id) on delete cascade,
  articulo      text not null check (articulo in ('camiseta', 'sudadera')),
  talla         text not null,
  cantidad      int  not null default 1 check (cantidad > 0),
  creado_por    uuid references perfiles (id),
  creado_en     timestamptz not null default now()
);

create index on pedidos (deportista_id);

alter table pedidos enable row level security;

create policy p_pedidos_leer   on pedidos for select using (es_director());
create policy p_pedidos_crear  on pedidos for insert with check (es_director());
create policy p_pedidos_borrar on pedidos for delete using (es_director());
