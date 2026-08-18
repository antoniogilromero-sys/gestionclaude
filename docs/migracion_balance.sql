-- Balance del club: ingresos y gastos reales (no estimaciones), dentro de
-- Administración. Solo director, como facturas/pagos_extra.
--
-- No sustituye a `facturas` (ingresos ya facturados a familias) ni a
-- `pagos_extra` (pagos extra a entrenadores) — esas tablas siguen
-- existiendo tal cual. El balance las suma junto con estos movimientos
-- para dar el total real, en vez de duplicar datos que ya se escriben en
-- otro sitio.

create table movimientos_club (
  id         bigint generated always as identity primary key,
  tipo       text not null check (tipo in ('ingreso', 'gasto')),
  categoria  text not null,
  concepto   text,
  importe    numeric(9,2) not null check (importe > 0),
  fecha      date not null default current_date,
  creado_por uuid references perfiles (id),
  creado_en  timestamptz not null default now()
);

create index on movimientos_club (fecha);

alter table movimientos_club enable row level security;

create policy p_movimientos_leer   on movimientos_club for select using (es_director());
create policy p_movimientos_crear  on movimientos_club for insert with check (es_director());
create policy p_movimientos_borrar on movimientos_club for delete using (es_director());
