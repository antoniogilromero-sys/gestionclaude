-- Quién cobra por ir a cada competición del calendario (Próximas
-- competiciones). Solo cuatro personas pueden aparecer: Sonia, Celia,
-- Héctor y Toni, a 80 € por competición cada uno (el importe vive en
-- src/lib/costes.ts, EUROS_COMPETICION).
--
-- Va ligado a `proximas_competiciones` y a `perfiles` (no a nombres sueltos),
-- y cuenta en el coste de la semana en la que cae la fecha de la competición.

create table if not exists competicion_entrenador (
  competicion_id bigint not null references proximas_competiciones (id) on delete cascade,
  entrenador_id  uuid   not null references perfiles (id) on delete cascade,
  primary key (competicion_id, entrenador_id)
);

alter table competicion_entrenador enable row level security;

-- Dinero del equipo: solo el director lo ve y lo toca, como pagos/tarifas.
drop policy if exists p_compent_admin on competicion_entrenador;
create policy p_compent_admin on competicion_entrenador
  for all using (es_director()) with check (es_director());

-- Las cuatro personas que pueden ir a competiciones, identificadas por
-- email (el nombre de perfil a veces es el propio email). El nombre que se
-- enseña es el del cuadro de personal (Sonia, Héctor, Celia, Toni).
create or replace function entrenadores_competicion()
returns table (id uuid, nombre text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, coalesce(pt.nombre, p.nombre) as nombre
  from perfiles p
  left join personal_temporada pt on lower(pt.email) = lower(p.email)
  where es_director()
    and p.activo
    and lower(p.email) in (
      'soniacesteros@gmail.com',
      'llitomtb@gmail.com',
      'c.calderonsantamaria@gmail.com',
      'antoniogilromero@gmail.com'
    )
  order by coalesce(pt.nombre, p.nombre);
$$;

revoke all on function entrenadores_competicion() from public;
grant execute on function entrenadores_competicion() to authenticated;

-- Comprobación: debe listar a los cuatro (los que ya tengan cuenta).
select * from entrenadores_competicion();
