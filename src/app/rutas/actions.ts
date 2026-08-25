"use server";

import { createClient } from "@/lib/supabase/server";
import { sincronizarRutasClub } from "@/lib/strava";

type Resultado = { error: string } | { ok: true; sincronizadas: number };

// Nunca lanza: Next.js oculta el mensaje de un `throw` en producción.
async function requireDirector(): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.rol !== "director") {
    return { error: "Solo el director puede hacer esto" };
  }
  return { ok: true };
}

export async function sincronizarRutas(): Promise<Resultado> {
  const r = await requireDirector();
  if ("error" in r) return { error: r.error };

  const resultado = await sincronizarRutasClub();
  if (!resultado.ok) return { error: resultado.error ?? "Fallo al sincronizar con Strava" };
  return { ok: true, sincronizadas: resultado.sincronizadas };
}
