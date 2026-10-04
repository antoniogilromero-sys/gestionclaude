-- =====================================================================
--  Permitir a un entrenador borrar los entrenamientos que ha publicado él
--  Pegar entero en Supabase > SQL Editor > Run (una sola vez).
-- =====================================================================
--
-- Hasta ahora solo el director (p_ses_admin, "for all") podía borrar
-- sesiones. Esto añade una política más, sin tocar la del director (las
-- políticas se combinan con OR): cada autor puede borrar SOLO las suyas,
-- por si publica un entrenamiento con un error. Al borrar una sesión
-- se borran solas sus filas de sesion_grupo y sesion_vista (on delete
-- cascade en el esquema).

drop policy if exists p_ses_borrar_propia on sesiones;
create policy p_ses_borrar_propia on sesiones
  for delete using (autor_id = auth.uid());
