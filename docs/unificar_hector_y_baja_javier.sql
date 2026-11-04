-- =====================================================================
--  1) Unifica las dos fichas de Héctor en /pagos y /reparto:
--       - se queda la ficha que se llama "Hector"
--       - hjdelacalle@gmail.com pasa todo a Hector y queda desactivada
--  2) Quita de la lista a javiergilromero85@gmail.com (baja, no borrado)
--  Pegar entero en Supabase > SQL Editor > Run, una sola vez.
--
--  OJO: una ficha desactivada ya no puede entrar a la app (la app solo
--  deja entrar a las cuentas activas). Héctor tiene que entrar siempre
--  con la cuenta de "Hector"; Javier ya no tendrá acceso. Se deshace
--  desde /equipo con "Reactivar".
-- =====================================================================

do $$
declare
  v_destino uuid;
  v_origen  uuid;
  n         int;
begin
  select count(*) into n from perfiles
  where unaccent(lower(trim(nombre))) = 'hector' and rol in ('director', 'entrenador');
  if n <> 1 then
    raise exception 'Esperaba exactamente una ficha llamada Hector y hay %', n;
  end if;
  select id into v_destino from perfiles
  where unaccent(lower(trim(nombre))) = 'hector' and rol in ('director', 'entrenador');

  select count(*) into n from perfiles where lower(trim(email)) = 'hjdelacalle@gmail.com';
  if n <> 1 then
    raise exception 'Esperaba exactamente una ficha con hjdelacalle@gmail.com y hay %', n;
  end if;
  select id into v_origen from perfiles where lower(trim(email)) = 'hjdelacalle@gmail.com';

  if v_destino = v_origen then
    raise exception 'Las dos fichas son la misma, no hay nada que unificar';
  end if;

  -- Horas del reparto semanal: pasan a Hector sin duplicar semanas ya puestas
  insert into asignaciones (semana, grupo_id, entrenador_id, creada_en)
  select semana, grupo_id, v_destino, creada_en
  from asignaciones where entrenador_id = v_origen
  on conflict do nothing;
  delete from asignaciones where entrenador_id = v_origen;

  -- Entrenamientos publicados y avisos de lectura
  update sesiones set autor_id = v_destino where autor_id = v_origen;
  insert into sesion_vista (sesion_id, entrenador_id, vista_en)
  select sesion_id, v_destino, vista_en from sesion_vista where entrenador_id = v_origen
  on conflict do nothing;
  delete from sesion_vista where entrenador_id = v_origen;

  -- Las tablas siguientes pueden no existir si falta alguna migración:
  -- en ese caso se saltan sin dar error.
  if to_regclass('public.tarifas_entrenador') is not null then
    insert into tarifas_entrenador (entrenador_id, disciplina, euros_hora)
    select v_destino, disciplina, euros_hora
    from tarifas_entrenador where entrenador_id = v_origen
    on conflict do nothing;
    delete from tarifas_entrenador where entrenador_id = v_origen;
  end if;

  if to_regclass('public.pagos_extra') is not null then
    update pagos_extra set entrenador_id = v_destino where entrenador_id = v_origen;
  end if;

  if to_regclass('public.pagos_reales') is not null then
    -- Si los dos tienen pago real el mismo mes, se suman (es dinero ya pagado)
    update pagos_reales d
    set importe = d.importe + s.importe,
        nota = concat_ws(' · ', d.nota, s.nota),
        actualizado_en = now()
    from pagos_reales s
    where d.entrenador_id = v_destino and s.entrenador_id = v_origen and d.mes = s.mes;
    delete from pagos_reales s
    using pagos_reales d
    where s.entrenador_id = v_origen and d.entrenador_id = v_destino and d.mes = s.mes;
    update pagos_reales set entrenador_id = v_destino where entrenador_id = v_origen;
  end if;

  if to_regclass('public.competicion_entrenador') is not null then
    insert into competicion_entrenador (competicion_id, entrenador_id)
    select competicion_id, v_destino from competicion_entrenador where entrenador_id = v_origen
    on conflict do nothing;
    delete from competicion_entrenador where entrenador_id = v_origen;
  end if;

  if to_regclass('public.jornada_entrenador') is not null then
    insert into jornada_entrenador (jornada_id, entrenador_id)
    select jornada_id, v_destino from jornada_entrenador where entrenador_id = v_origen
    on conflict do nothing;
    delete from jornada_entrenador where entrenador_id = v_origen;
  end if;

  -- La ficha duplicada se desactiva (no se borra, por si hiciera falta volver atrás)
  update perfiles set activo = false where id = v_origen;
end $$;

-- Javier sale de la lista (baja, no borrado)
update perfiles set activo = false where lower(trim(email)) = 'javiergilromero85@gmail.com';

-- Comprobación: Hector una sola vez, y ni hjdelacalle ni javier entre los activos
select nombre, email, rol, activo
from perfiles
where rol in ('director', 'entrenador')
order by activo desc, nombre;
