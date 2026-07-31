-- =====================================================================
--  Teléfono de contacto para entrenadores
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
--
--  Sin domicilio ni cuenta bancaria: eso se queda en tus ficheros propios,
--  igual que decidiste para los deportistas. Solo nombre, email (ya venía
--  de la cuenta) y teléfono, y solo el director lo ve y lo edita (misma
--  política p_perfil_propio / p_perfil_editar que ya protege el resto de
--  la tabla perfiles).
-- =====================================================================

alter table perfiles add column if not exists telefono text;
