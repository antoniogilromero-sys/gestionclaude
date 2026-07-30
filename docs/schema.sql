-- =====================================================================
--  C.D.E. TRIATLON ALPEDRETE  ·  esquema de base de datos (Supabase)
--  Pegar entero en Supabase > SQL Editor > Run.
--
--  Principio de diseno: aqui NO hay DNI, domicilios ni telefonos.
--  Esos datos se quedan en tus ficheros de gestion. La aplicacion solo
--  maneja lo que un entrenador necesita a pie de pista: nombre, grupo
--  y rendimiento. Eso reduce el riesgo si algun dia hay una brecha.
-- =====================================================================

-- ---------------------------------------------------------------- ROLES
create type rol as enum ('director', 'entrenador', 'pendiente');

-- Perfil de cada usuario que se registra. Se crea solo (trigger abajo)
-- con rol 'pendiente': nadie ve nada hasta que tu lo apruebas.
create table perfiles (
  id          uuid primary key references auth.users on delete cascade,
  nombre      text not null,
  email       text not null,
  rol         rol  not null default 'pendiente',
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

create or replace function nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), new.email);
  return new;
end $$;

create trigger al_registrarse
  after insert on auth.users
  for each row execute function nuevo_usuario();

-- Helper usado por las politicas. SECURITY DEFINER para poder leer
-- 'perfiles' sin que la propia politica se llame a si misma.
-- Usuario dado de alta y aprobado. Ojo: quien se registra entra como
-- 'pendiente', y hasta que el director no lo aprueba no debe leer NADA.
create or replace function aprobado()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles
                 where id = auth.uid() and activo
                   and rol in ('director','entrenador'));
$$;

create or replace function es_director()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles
                 where id = auth.uid() and rol = 'director' and activo);
$$;

-- --------------------------------------------------------------- GRUPOS
-- Un grupo es nivel + horario: "Intermedio martes y jueves de 19 a 20"
-- es un grupo distinto de "Avanzado" aunque compartan franja y vaso.
create table grupos (
  id           bigint generated always as identity primary key,
  nombre       text not null unique,
  disciplina   text not null default 'natacion',
  dias         text[] not null default '{}',      -- {martes,jueves}
  hora_inicio  time,
  hora_fin     time,
  temporada    text not null default '2026/2027',
  activo       boolean not null default true
);

-- ASIGNACION SEMANAL. El director reparte los grupos cada domingo, asi que
-- esto no es una relacion fija: es una foto de cada semana. 'semana' guarda
-- SIEMPRE el lunes de esa semana, para que no haya dos formas de escribirla.
create table asignaciones (
  semana        date   not null,
  grupo_id      bigint not null references grupos   (id) on delete cascade,
  entrenador_id uuid   not null references perfiles (id) on delete cascade,
  creada_en     timestamptz not null default now(),
  primary key (semana, grupo_id, entrenador_id),
  constraint semana_es_lunes check (extract(isodow from semana) = 1)
);

create index on asignaciones (entrenador_id, semana);

create or replace function lunes(d date default current_date)
returns date language sql immutable as $$
  select (date_trunc('week', d))::date;
$$;

-- Que grupos lleva un entrenador esta semana (ventana de tres semanas: la
-- anterior, la actual y la siguiente).
-- NO se usa para restringir el acceso: todos los entrenadores ven a todos los
-- deportistas. Sirve para que la app le ponga delante SUS grupos primero.
create or replace function entrena_grupo(g bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from asignaciones
    where entrenador_id = auth.uid()
      and grupo_id = g
      and semana between lunes() - 7 and lunes() + 7
  );
$$;

-- ---------------------------------------------------------- DEPORTISTAS
create table deportistas (
  id           bigint generated always as identity primary key,
  ref          text unique,                       -- D001... enlaza con tu Excel
  nombre       text not null,
  anio_nac     int,
  categoria    text,
  grupo_id     bigint references grupos (id) on delete set null,
  fc_max_ref   int,
  peso_ref     numeric(5,2),
  activo       boolean not null default true
);

-- --------------------------------------------------- ENTRENAMIENTOS
-- Lo que tu publicas como director y los entrenadores aplican.
create table sesiones (
  id            bigint generated always as identity primary key,
  fecha         date not null,
  titulo        text not null,
  disciplina    text check (disciplina in ('natacion','ciclismo','carrera','combinado','fuerza')),
  contenido     text not null,                    -- el entrenamiento en si
  material      text,
  autor_id      uuid references perfiles (id),
  publicada     boolean not null default false,
  creada_en     timestamptz not null default now()
);

create table sesion_grupo (
  sesion_id bigint references sesiones (id) on delete cascade,
  grupo_id  bigint references grupos   (id) on delete cascade,
  primary key (sesion_id, grupo_id)
);

-- Acuse de lectura: sabes quien ha abierto el entrenamiento de la semana.
create table sesion_vista (
  sesion_id     bigint references sesiones (id) on delete cascade,
  entrenador_id uuid   references perfiles  (id) on delete cascade,
  vista_en      timestamptz not null default now(),
  primary key (sesion_id, entrenador_id)
);

-- ---------------------------------------------------------------- TESTS
create table tipos_test (
  id            bigint generated always as identity primary key,
  nombre        text not null unique,
  disciplina    text not null,
  distancia_m   int,                              -- null = la marca es el resultado
  metrica       text not null check (metrica in ('tiempo','potencia','distancia')),
  mejor_es      text not null check (mejor_es in ('menor','mayor'))
);

create table resultados (
  id             bigint generated always as identity primary key,
  fecha          date not null default current_date,
  tipo_test_id   bigint not null references tipos_test  (id),
  deportista_id  bigint not null references deportistas (id) on delete cascade,
  registrado_por uuid   references perfiles (id),
  tiempo_s       numeric(8,2),
  distancia_m    int,
  potencia_w     int,
  peso_kg        numeric(5,2),
  fc_media       int,
  fc_max         int,
  fc_1min        int,
  rpe            int check (rpe between 0 and 10),
  condiciones    text,
  temperatura    int,
  notas          text,
  creado_en      timestamptz not null default now(),
  unique (fecha, tipo_test_id, deportista_id)
);

create index on resultados (deportista_id, tipo_test_id, fecha);
create index on deportistas (grupo_id);
create index on sesiones (fecha desc);

-- Ritmo y velocidad calculados, para no repetir la formula en cada pantalla.
create view resultados_calc as
select r.*,
       d.nombre     as deportista,
       d.grupo_id,
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

-- ================================================================ RLS
-- Sin esto cualquiera con la clave publica leeria toda la base.
alter table perfiles         enable row level security;
alter table grupos           enable row level security;
alter table asignaciones     enable row level security;
alter table deportistas      enable row level security;
alter table sesiones         enable row level security;
alter table sesion_grupo     enable row level security;
alter table sesion_vista     enable row level security;
alter table tipos_test       enable row level security;
alter table resultados       enable row level security;

-- Perfiles: cada uno ve el suyo; el director ve y edita todos (aprobar altas).
create policy p_perfil_propio  on perfiles for select using (id = auth.uid() or es_director());
create policy p_perfil_editar  on perfiles for update using (es_director()) with check (es_director());

-- Catalogos: los lee cualquier usuario aprobado; solo el director escribe.
create policy p_grupos_leer    on grupos     for select using (aprobado());
create policy p_grupos_admin   on grupos     for all    using (es_director()) with check (es_director());
create policy p_tipos_leer     on tipos_test for select using (aprobado());
create policy p_tipos_admin    on tipos_test for all    using (es_director()) with check (es_director());

-- El reparto de la semana lo ve todo el equipo: asi cada uno sabe quien
-- esta cubriendo que grupo sin tener que preguntar.
create policy p_asig_leer      on asignaciones for select using (aprobado());
create policy p_asig_admin     on asignaciones for all
  using (es_director()) with check (es_director());

-- Deportistas: los ve cualquier entrenador aprobado, de cualquier grupo.
-- Aqui no hay DNI, domicilio ni telefono: solo nombre, categoria y grupo.
create policy p_dep_leer  on deportistas for select using (aprobado());
create policy p_dep_admin on deportistas for all
  using (es_director()) with check (es_director());

-- Sesiones: cualquier entrenador ve todo lo publicado, sea de su grupo o no.
-- Los borradores son solo del director hasta que les da a publicar.
create policy p_ses_leer on sesiones for select using (
  es_director() or (publicada and aprobado())
);
create policy p_ses_admin    on sesiones     for all using (es_director()) with check (es_director());
create policy p_sesgr_leer   on sesion_grupo for select using (aprobado());
create policy p_sesgr_admin  on sesion_grupo for all    using (es_director()) with check (es_director());

create policy p_vista_propia on sesion_vista for select using (aprobado());
create policy p_vista_marcar on sesion_vista for insert with check (entrenador_id = auth.uid());

-- ============================ RESULTADOS: LA FRONTERA ===============
-- Esta es LA restriccion del sistema. Todo lo demas lo ve el equipo tecnico
-- entero; el historico de marcas y el analisis, no. Solo el director.
--
-- El entrenador ve unicamente los ultimos 7 dias. No es un permiso a medias:
-- es lo minimo para que la pantalla de registro funcione. Necesita ver a
-- quien lleva tomado para no repetirlo, corregir un tiempo mal metido, y
-- cerrar el jueves un test que empezo el martes. Nada anterior le llega,
-- asi que no puede reconstruir la evolucion de nadie.
--
-- Si algun dia se amplia esa ventana, se pierde la separacion entera.
create policy p_res_leer on resultados for select using (
  es_director()
  or (aprobado() and fecha >= current_date - interval '7 days')
);

-- Registrar: cualquier entrenador aprobado, a cualquier deportista. Con el
-- reparto cambiando cada domingo, atarlo al grupo asignado solo daria
-- problemas el dia que uno cubra a otro. Queda constancia de quien lo metio.
create policy p_res_crear on resultados for insert with check (
  aprobado() and registrado_por = auth.uid()
);

-- Corregir: dentro de la misma ventana de 7 dias. El director, sin limite.
create policy p_res_editar on resultados for update using (
  es_director()
  or (aprobado() and fecha >= current_date - interval '7 days')
);

create policy p_res_borrar on resultados for delete using (es_director());

-- ====================================================== DATOS INICIALES
-- Grupos reales de natacion de la temporada 26/27.
-- OJO: revisa el nombre del primero y ajusta lo que no cuadre.
insert into grupos (nombre, disciplina, dias, hora_inicio, hora_fin) values
  ('Escuela jueves',      'natacion', '{jueves}',         '18:00', '19:00'),
  ('Peques',              'natacion', '{martes}',         '19:00', '20:00'),
  ('Intermedio',          'natacion', '{martes,jueves}',  '19:00', '20:00'),
  ('Avanzado',            'natacion', '{martes,jueves}',  '19:00', '20:00'),
  ('Adultos competicion', 'natacion', '{martes,jueves}',  '20:00', '21:00');

insert into tipos_test (nombre, disciplina, distancia_m, metrica, mejor_es) values
  ('50 m natacion',      'natacion',    50, 'tiempo',   'menor'),
  ('100 m natacion',     'natacion',   100, 'tiempo',   'menor'),
  ('200 m natacion',     'natacion',   200, 'tiempo',   'menor'),
  ('400 m natacion',     'natacion',   400, 'tiempo',   'menor'),
  ('800 m natacion',     'natacion',   800, 'tiempo',   'menor'),
  ('1000 m natacion',    'natacion',  1000, 'tiempo',   'menor'),
  ('60 m carrera',       'carrera',     60, 'tiempo',   'menor'),
  ('400 m carrera',      'carrera',    400, 'tiempo',   'menor'),
  ('1 km carrera',       'carrera',   1000, 'tiempo',   'menor'),
  ('2 km carrera',       'carrera',   2000, 'tiempo',   'menor'),
  ('3 km carrera',       'carrera',   3000, 'tiempo',   'menor'),
  ('5 km carrera',       'carrera',   5000, 'tiempo',   'menor'),
  ('10 km carrera',      'carrera',  10000, 'tiempo',   'menor'),
  ('Test Cooper 12 min', 'carrera',   null, 'distancia','mayor'),
  ('Course Navette',     'carrera',   null, 'distancia','mayor'),
  ('FTP bici 20 min',    'ciclismo',  null, 'potencia', 'mayor'),
  ('Test bici 5 min',    'ciclismo',  null, 'potencia', 'mayor'),
  ('Test bici 1 min',    'ciclismo',  null, 'potencia', 'mayor'),
  ('10 km bici CRI',     'ciclismo', 10000, 'tiempo',   'menor'),
  ('20 km bici CRI',     'ciclismo', 20000, 'tiempo',   'menor');

-- PASO MANUAL, una sola vez: registrate en la app con tu correo y luego
-- ejecuta esto sustituyendo el email, para darte a ti mismo el rol director.
--
--   update perfiles set rol = 'director' where email = 'tu@correo.com';
--
-- A partir de ahi apruebas al resto de entrenadores desde la aplicacion.
