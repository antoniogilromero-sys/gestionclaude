"use server";

import { createClient } from "@/lib/supabase/server";

// Next.js oculta el mensaje real de cualquier `throw` dentro de una server
// action en producción (solo deja un "digest"). Estas acciones nunca lanzan:
// siempre devuelven { error } o el resultado, para que el mensaje llegue
// intacto a la pantalla.
export async function setAsignacion(
  semana: string,
  grupoId: number,
  entrenadorId: string,
  asignar: boolean,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();

  if (asignar) {
    const { error } = await supabase
      .from("asignaciones")
      .insert({ semana, grupo_id: grupoId, entrenador_id: entrenadorId });
    if (error && error.code !== "23505") return { error: error.message };
  } else {
    const { error } = await supabase
      .from("asignaciones")
      .delete()
      .eq("semana", semana)
      .eq("grupo_id", grupoId)
      .eq("entrenador_id", entrenadorId);
    if (error) return { error: error.message };
  }
  return { ok: true };
}

export async function copiarSemanaAnterior(
  semanaDestino: string,
  semanaOrigen: string,
): Promise<{ error: string } | { copiado: boolean; filas: number }> {
  const supabase = await createClient();

  // Borra e inserta dentro de una sola función de Postgres (atómico): si
  // el paso de insertar fallara, no se llega a borrar la semana destino.
  // Antes esto se hacía en dos pasos sueltos desde aquí y un fallo a
  // mitad dejaba la semana destino vacía sin poder deshacerlo.
  const { data: filas, error } = await supabase.rpc("copiar_asignaciones_semana", {
    p_semana_destino: semanaDestino,
    p_semana_origen: semanaOrigen,
  });
  if (error) return { error: error.message };

  return { copiado: (filas ?? 0) > 0, filas: filas ?? 0 };
}
