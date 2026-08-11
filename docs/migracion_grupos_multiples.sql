-- =====================================================================
--  DEPORTISTAS EN VARIOS GRUPOS A LA VEZ + NUEVOS GRUPOS DE NATACION
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Hasta ahora cada deportista solo podia estar en UN grupo
-- (deportistas.grupo_id). Antón separó los grupos de natación por día
-- suelto (ej. "Martes Avanzado 19h" y "Jueves Avanzado 19h" en vez de un
-- único "Avanzado" que cubría los dos días) y confirmó explícitamente
-- que un mismo deportista puede estar apuntado a VARIOS de esos horarios
-- a la vez (va martes Y jueves). Por eso deportistas.grupo_id (una sola
-- relación) ya no sirve: se sustituye por una tabla intermedia
-- deportista_grupo (muchos a muchos). La columna deportistas.grupo_id se
-- deja tal cual por si algo externo la mira, pero la app deja de usarla.

create table deportista_grupo (
  deportista_id bigint not null references deportistas (id) on delete cascade,
  grupo_id      bigint not null references grupos      (id) on delete cascade,
  primary key (deportista_id, grupo_id)
);

create index on deportista_grupo (grupo_id);

alter table deportista_grupo enable row level security;
create policy p_depgr_leer  on deportista_grupo for select using (aprobado());
create policy p_depgr_admin on deportista_grupo for all
  using (es_director()) with check (es_director());

-- Traspasa las asignaciones que ya existían, para no perder lo que había.
insert into deportista_grupo (deportista_id, grupo_id)
select id, grupo_id from deportistas where grupo_id is not null
on conflict do nothing;

-- resultados_calc necesita exponer TODOS los grupos de cada deportista,
-- no uno solo, para que "Comparativa de grupo" siga funcionando. Postgres
-- no deja renombrar una columna de vista con "or replace" (grupo_id ->
-- grupo_ids), así que hay que borrarla primero.
drop view if exists resultados_calc;
create view resultados_calc as
select r.*,
       d.nombre as deportista,
       coalesce(
         (select array_agg(dg.grupo_id order by dg.grupo_id)
          from deportista_grupo dg where dg.deportista_id = d.id),
         '{}'::bigint[]
       ) as grupo_ids,
       t.nombre     as test,
       t.disciplina,
       t.metrica,
       t.mejor_es,
       coalesce(r.distancia_m, t.distancia_m) as dist_m,
       case when r.tiempo_s > 0 and coalesce(r.distancia_m, t.distancia_m) > 0 then
         case when t.disciplina = 'natacion'
              then r.tiempo_s / (coalesce(r.distancia_m, t.distancia_m) / 100.0)
              else r.tiempo_s / (coalesce(r.distancia_m, t.distancia_m) / 1000.0)
         end
       end as ritmo_s,
       case when r.tiempo_s > 0 and coalesce(r.distancia_m, t.distancia_m) > 0
            then (coalesce(r.distancia_m, t.distancia_m) / 1000.0) / (r.tiempo_s / 3600.0)
       end as vel_kmh,
       case when r.potencia_w is not null and r.peso_kg > 0
            then r.potencia_w / r.peso_kg end as w_kg,
       case when r.fc_max is not null and r.fc_1min is not null
            then r.fc_max - r.fc_1min end as recuperacion
from resultados r
join deportistas d on d.id = r.deportista_id
join tipos_test  t on t.id = r.tipo_test_id;

-- mejores_marcas() (Rankings) también devolvía un único grupo por
-- deportista: ahora devuelve los nombres de todos sus grupos juntos.
-- Igual que con la vista: cambiar la forma de las columnas de salida
-- obliga a borrar la función antes de recrearla.
drop function if exists mejores_marcas(int);
create function mejores_marcas(p_anio int default extract(year from current_date)::int)
returns table (
  deportista_id bigint,
  deportista    text,
  categoria     text,
  grupos        text,
  tipo_test_id  bigint,
  test          text,
  disciplina    text,
  metrica       text,
  mejor_es      text,
  tiempo_s      numeric,
  distancia_m   int,
  potencia_w    int,
  fecha         date
)
language sql stable security definer set search_path = public as $$
  with marcas as (
    select res.*,
           row_number() over (
             partition by res.deportista_id, res.tipo_test_id
             order by case when tt.mejor_es = 'menor' then res.tiempo_s
                           else -coalesce(res.potencia_w, res.distancia_m)::numeric end asc
           ) as rn
    from resultados res
    join tipos_test tt on tt.id = res.tipo_test_id
    where aprobado() and extract(year from res.fecha)::int = p_anio
  )
  select m.deportista_id, d.nombre, d.categoria,
         (select string_agg(g.nombre, ', ' order by g.nombre)
          from deportista_grupo dg join grupos g on g.id = dg.grupo_id
          where dg.deportista_id = d.id) as grupos,
         m.tipo_test_id, t.nombre, t.disciplina, t.metrica, t.mejor_es,
         m.tiempo_s, m.distancia_m, m.potencia_w, m.fecha
  from marcas m
  join deportistas d on d.id = m.deportista_id
  join tipos_test  t on t.id = m.tipo_test_id
  where m.rn = 1 and d.activo;
$$;

revoke all on function mejores_marcas(int) from public;
grant execute on function mejores_marcas(int) to authenticated;

-- Cambiar de golpe los grupos de un deportista (borra los que tenía y
-- pone los nuevos) en una sola operación, desde la app.
create or replace function set_grupos_deportista(p_deportista_id bigint, p_grupo_ids bigint[])
returns void language plpgsql security invoker as $$
begin
  if not es_director() then
    raise exception 'Solo el director puede cambiar grupos';
  end if;
  delete from deportista_grupo where deportista_id = p_deportista_id;
  if p_grupo_ids is not null and array_length(p_grupo_ids, 1) > 0 then
    insert into deportista_grupo (deportista_id, grupo_id)
    select p_deportista_id, g from unnest(p_grupo_ids) as g;
  end if;
end $$;

grant execute on function set_grupos_deportista(bigint, bigint[]) to authenticated;

-- Los 13 grupos nuevos de natación (sustituyen a los 5 antiguos: Escuela
-- jueves, Peques, Intermedio, Avanzado, Adultos competición). Los
-- antiguos NO se borran solos por si algún deportista sigue apuntado a
-- ellos: bórralos tú a mano desde Supabase cuando hayas reasignado a
-- todo el mundo a los nuevos, desde /deportistas en la app.
insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin) values
  ('Martes Peques 19h',    'natacion', '{martes}', '19:00', '20:00'),
  ('Martes Medio 19h',     'natacion', '{martes}', '19:00', '20:00'),
  ('Martes Avanzado 19h',  'natacion', '{martes}', '19:00', '20:00'),
  ('Martes Bajo 20h',      'natacion', '{martes}', '20:00', '21:00'),
  ('Martes Medio 20h',     'natacion', '{martes}', '20:00', '21:00'),
  ('Martes Avanzado 20h',  'natacion', '{martes}', '20:00', '21:00'),
  ('Jueves Peques 19h',    'natacion', '{jueves}', '19:00', '20:00'),
  ('Jueves Medio 19h',     'natacion', '{jueves}', '19:00', '20:00'),
  ('Jueves Avanzado 19h',  'natacion', '{jueves}', '19:00', '20:00'),
  ('Jueves Bajo 20h',      'natacion', '{jueves}', '20:00', '21:00'),
  ('Jueves Medio 20h',     'natacion', '{jueves}', '20:00', '21:00'),
  ('Jueves Avanzado 20h',  'natacion', '{jueves}', '20:00', '21:00'),
  ('Jueves 18h',           'natacion', '{jueves}', '18:00', '19:00');
