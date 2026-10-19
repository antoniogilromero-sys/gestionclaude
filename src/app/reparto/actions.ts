"use server";

import { revalidatePath } from "next/cache";
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

  // Comprobación final: se vuelve a leer la base de datos para confirmar
  // que el cambio ha quedado guardado de verdad. Supabase no da error
  // cuando un permiso impide borrar (simplemente no borra nada), así que
  // sin esto el botón podía cambiar de color sin que se guardara nada.
  const { data: fila, error: errorLectura } = await supabase
    .from("asignaciones")
    .select("grupo_id")
    .eq("semana", semana)
    .eq("grupo_id", grupoId)
    .eq("entrenador_id", entrenadorId)
    .maybeSingle();
  if (errorLectura) return { error: errorLectura.message };
  if (Boolean(fila) !== asignar) {
    return {
      error: asignar
        ? "No se ha podido guardar esta asignación. Vuelve a intentarlo."
        : "No se ha podido quitar esta asignación. Vuelve a intentarlo.",
    };
  }

  // Sin esto, al volver a /reparto con "atrás" o desde otra pantalla, el
  // navegador podía enseñar la versión de antes del cambio.
  revalidatePath("/reparto");
  return { ok: true };
}

// Marca (o desmarca) que un entrenador va a una competición del calendario.
// Solo el director, y solo las cuatro personas que pueden cobrar
// competiciones: se comprueba aquí en el servidor, no solo en la pantalla.
export async function setCompeticionEntrenador(
  competicionId: number,
  entrenadorId: string,
  asignar: boolean,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || perfil.rol !== "director") return { error: "Solo el director puede hacer esto" };

  const { data: permitidos, error: errorPermitidos } = await supabase.rpc("entrenadores_competicion");
  if (errorPermitidos) return { error: errorPermitidos.message };
  if (!(permitidos ?? []).some((p: { id: string }) => p.id === entrenadorId)) {
    return { error: "Solo Sonia, Celia, Héctor y Toni pueden ir a competiciones" };
  }

  if (asignar) {
    const { error } = await supabase
      .from("competicion_entrenador")
      .insert({ competicion_id: competicionId, entrenador_id: entrenadorId });
    if (error && error.code !== "23505") return { error: error.message };
  } else {
    const { error } = await supabase
      .from("competicion_entrenador")
      .delete()
      .eq("competicion_id", competicionId)
      .eq("entrenador_id", entrenadorId);
    if (error) return { error: error.message };
  }

  revalidatePath("/reparto");
  revalidatePath("/pagos");
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

  revalidatePath("/reparto");
  return { copiado: (filas ?? 0) > 0, filas: filas ?? 0 };
}
