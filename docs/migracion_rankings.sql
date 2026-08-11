-- =====================================================================
--  RANKINGS INTERNOS POR CATEGORIA
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Antón pidió que el equipo tecnico (no solo el director) pueda ver un
-- ranking con la mejor marca de cada deportista por prueba y categoria,
-- para usarlo como contenido de redes ("mejores tiempos 100m libres
-- sub-14 esta temporada").
--
-- Esto TOCA la frontera de seguridad de schema.sql: "el historico de
-- marcas y el analisis, no. Solo el director." La decision fue
-- deliberada y explicita de Anton (no ampliar la ventana de 7 dias de
-- la tabla `resultados` en si, que sigue igual de cerrada) — en su
-- lugar, esta funcion SECURITY DEFINER calcula SOLO la mejor marca de
-- cada deportista por prueba y año, sin exponer el resto del historico
-- (fechas de intentos anteriores, RPE, FC, notas...). Un entrenador
-- puede ver "el mejor 100m libres de fulanito este año fue 1'05" pero
-- no puede reconstruir toda su evolucion como sí puede el director en
-- /analisis.
create or replace function mejores_marcas(p_anio int default extract(year from current_date)::int)
returns table (
  deportista_id bigint,
  deportista    text,
  categoria     text,
  grupo_id      bigint,
  grupo         text,
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
  select m.deportista_id, d.nombre, d.categoria, d.grupo_id, g.nombre,
         m.tipo_test_id, t.nombre, t.disciplina, t.metrica, t.mejor_es,
         m.tiempo_s, m.distancia_m, m.potencia_w, m.fecha
  from marcas m
  join deportistas d on d.id = m.deportista_id
  join tipos_test  t on t.id = m.tipo_test_id
  left join grupos g on g.id = d.grupo_id
  where m.rn = 1 and d.activo;
$$;

-- Solo usuarios logueados y aprobados pueden llamarla (comprobado dentro
-- de la propia funcion via aprobado(); si no está aprobado, el where
-- interno no encuentra filas y devuelve la tabla vacía, no un error).
revoke all on function mejores_marcas(int) from public;
grant execute on function mejores_marcas(int) to authenticated;
