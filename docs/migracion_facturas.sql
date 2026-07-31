-- =====================================================================
--  Facturas (exentas de IVA, art. 20.Uno.13º LIVA)
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
--
--  El numero es una columna identity que EMPIEZA EN 65 porque Antón ya
--  había emitido facturas del 1 al 64 por su cuenta este año: la
--  numeración tiene que continuar sin huecos ni repetirse, no empezar de
--  cero. Postgres garantiza que dos personas emitiendo a la vez nunca
--  reciban el mismo número.
--
--  No hay política de update ni de delete a propósito: una factura fiscal
--  no se edita ni se borra una vez emitida (si hay un error, lo correcto
--  es una factura rectificativa, no tocar la original). Es la única tabla
--  de la app donde eso es así.
-- =====================================================================

create table facturas (
  numero            bigint generated always as identity (start with 65) primary key,
  fecha             date not null default current_date,
  pagador_nombre    text not null,
  pagador_nif       text not null,
  pagador_direccion text,
  concepto          text not null,
  importe           numeric(8,2) not null check (importe > 0),
  creada_por        uuid references perfiles (id),
  creada_en         timestamptz not null default now()
);

alter table facturas enable row level security;

-- Es información fiscal y de pagadores (padres/madres, no deportistas):
-- solo el director la ve y la crea. Sin política de update/delete: ver
-- comentario de arriba.
create policy p_facturas_leer  on facturas for select using (es_director());
create policy p_facturas_crear on facturas for insert with check (es_director());
