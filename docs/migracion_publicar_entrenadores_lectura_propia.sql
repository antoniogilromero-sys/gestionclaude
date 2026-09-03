-- =====================================================================
--  Arreglo: un entrenador tiene que poder leer su propia sesión recién
--  creada, aunque todavía sea un borrador
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Antón reportó que a Sonia y a Nacho (entrenadores) no les dejaba
-- publicar entrenamientos: "new row violates row-level security policy
-- for table sesiones". La causa real: `publicarSesion` hace
-- `insert(...).select("id")`, y eso exige permiso de LECTURA sobre la
-- fila recién creada, no solo de escritura — la política de lectura
-- (`p_ses_leer`) decía "el director ve todo, el entrenador solo lo ya
-- publicado", y en ese instante la sesión todavía es un borrador
-- (`publicada = false`, se marca `true` en un segundo paso dentro de la
-- misma acción). Así que un entrenador no podía ni leer la fila que él
-- mismo acababa de crear, y el proceso entero fallaba ahí.
--
-- Se añade una política de lectura más, para que cualquiera vea SU
-- PROPIA sesión sin importar si está publicada o no (además de seguir
-- viendo las publicadas de los demás, como ya podía). Se combina con la
-- que ya había (las políticas RLS se combinan con OR), sin quitar nada.

create policy p_ses_leer_propia on sesiones
  for select using (autor_id = auth.uid());
