"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Solo el director: un entrenador tiene política de update sobre sus
// propias sesiones (hace falta para el paso borrador→publicar), pero
// cambiar la fecha de un entrenamiento ya publicado es cosa de dirección.
export async function cambiarFechaSesion(
  id: number,
  fecha: string,
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || perfil.rol !== "director") return { error: "Solo el director puede hacer esto" };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha no válida" };

  const { data, error } = await supabase.from("sesiones").update({ fecha }).eq("id", id).select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "No se ha podido cambiar la fecha" };

  revalidatePath("/entrenamientos");
  revalidatePath(`/entrenamientos/${id}`);
  revalidatePath("/programacion");
  revalidatePath("/");
  return { ok: true };
}

// Nunca lanza: Next.js oculta el mensaje de un `throw` en producción.
// El director puede borrar cualquier entrenamiento; un entrenador, solo los
// que publicó él (política p_ses_borrar_propia). Un DELETE que la RLS
// bloquea no da error en Supabase, simplemente no borra nada — por eso se
// pide de vuelta la fila borrada y se comprueba que de verdad había una.
export async function borrarSesion(id: number): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data, error } = await supabase.from("sesiones").delete().eq("id", id).select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "No se ha podido borrar. Solo puedes borrar los entrenamientos que has publicado tú." };
  }

  revalidatePath("/entrenamientos");
  revalidatePath("/programacion");
  revalidatePath("/");
  return { ok: true };
}

export async function marcarVisto(sesionId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  // El acuse es para saber qué entrenadores han abierto la sesión; que el
  // director la vea al revisarla no debe contar como "vista por un entrenador".
  if (perfil?.rol === "director") return;

  const { error } = await supabase
    .from("sesion_vista")
    .insert({ sesion_id: sesionId, entrenador_id: user.id });
  if (error && error.code !== "23505") throw new Error(error.message);
}
