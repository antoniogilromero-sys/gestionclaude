-- =====================================================================
--  Abrir "Publicar" a los entrenadores (no solo al director)
--  Pegar en Supabase > SQL Editor > Run.
-- =====================================================================
--
-- Antón pidió (agosto 2026) que los entrenadores puedan subir ellos
-- mismos los entrenamientos que van a realizar (pensado sobre todo para
-- que lo hagan los sábados por la tarde/noche, de cara a su sesión).
-- Antes "Publicar" era solo del director; la política de sesiones
-- (`p_ses_admin`) restringía insert/update/delete a `es_director()`.
--
-- Se añaden dos políticas nuevas SIN QUITAR la que ya había (las
-- políticas RLS se combinan con OR, así que el director sigue pudiendo
-- editar/borrar cualquier sesión igual que siempre):
--   1. Cualquier `aprobado()` (director o entrenador) puede INSERTAR una
--      sesión nueva y sus filas de sesion_grupo.
--   2. Cualquier `aprobado()` puede ACTUALIZAR (solo) la sesión que él
--      mismo creó — hace falta porque `publicarSesion` la crea primero
--      como borrador y la marca "publicada" en un segundo paso; sin
--      esto, un entrenador podría crear la sesión pero no llegar a
--      publicarla. No puede tocar sesiones de otra persona.

create policy p_ses_crear_aprobado on sesiones
  for insert with check (aprobado());

create policy p_ses_actualizar_propia on sesiones
  for update using (autor_id = auth.uid()) with check (autor_id = auth.uid());

create policy p_sesgr_crear_aprobado on sesion_grupo
  for insert with check (aprobado());
