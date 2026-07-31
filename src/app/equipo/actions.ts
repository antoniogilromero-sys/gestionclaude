"use server";

import { createClient } from "@/lib/supabase/server";

type Resultado = { error: string } | { ok: true };
type DirectorCheck =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string };

// Nunca lanza: Next.js oculta el mensaje de un `throw` en producción, y
// aquí el director necesita saber exactamente qué ha fallado.
async function requireDirector(): Promise<DirectorCheck> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.rol !== "director") {
    return { ok: false, error: "Solo el director puede hacer esto" };
  }
  return { ok: true, supabase };
}

export async function aprobarEntrenador(perfilId: string): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase
    .from("perfiles")
    .update({ rol: "entrenador", activo: true })
    .eq("id", perfilId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function darDeBaja(perfilId: string): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("perfiles").update({ activo: false }).eq("id", perfilId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function reactivar(perfilId: string): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("perfiles").update({ activo: true }).eq("id", perfilId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function cambiarNombre(perfilId: string, nombre: string): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const limpio = nombre.trim();
  if (!limpio) return { error: "El nombre no puede estar vacío" };
  // Google manda el nombre completo de la cuenta (p. ej. "Antonio Gil
  // Romero"); en el club se les llama por el nombre de pila o el apodo
  // (Toni, Nacho, Nimai...), así que el director lo ajusta aquí.
  const { error } = await r.supabase.from("perfiles").update({ nombre: limpio }).eq("id", perfilId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function cambiarTelefono(perfilId: string, telefono: string): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase
    .from("perfiles")
    .update({ telefono: telefono.trim() || null })
    .eq("id", perfilId);
  if (error) return { error: error.message };
  return { ok: true };
}
