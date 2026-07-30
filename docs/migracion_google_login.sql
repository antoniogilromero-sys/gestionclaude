-- =====================================================================
--  Acceso con Google
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
--
--  Al entrar con Google, Supabase NO manda un campo 'nombre': manda
--  'full_name' y 'name'. Con el disparador original, un entrenador que
--  entrase con Google aparecia en la app con su correo como nombre
--  ("celia.lopez@gmail.com" en vez de "Celia"), y ademas el director no
--  podria reconocerlo facilmente en la pantalla de Equipo.
--
--  Esto actualiza el disparador para que lea tambien los campos de
--  Google, y de paso arregla los perfiles que ya se hayan creado mal.
-- =====================================================================

create or replace function nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'nombre',     ''),  -- alta por correo
      nullif(new.raw_user_meta_data->>'full_name',  ''),  -- Google
      nullif(new.raw_user_meta_data->>'name',       ''),  -- otros proveedores
      new.email
    ),
    new.email
  );
  return new;
end $$;

-- Arregla los perfiles ya creados cuyo nombre se quedo como el correo,
-- si el proveedor si mando un nombre de verdad.
update perfiles p
set nombre = coalesce(
      nullif(u.raw_user_meta_data->>'full_name', ''),
      nullif(u.raw_user_meta_data->>'name',      ''),
      p.nombre
    )
from auth.users u
where u.id = p.id
  and p.nombre = p.email;
