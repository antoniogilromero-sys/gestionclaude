"use server";

import { createClient } from "@/lib/supabase/server";
import { sincronizarActividadesStrava } from "@/lib/strava";

type Resultado = { error: string } | { ok: true };
type DirectorCheck =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; error: string };

// Nunca lanza: Next.js oculta el mensaje de un `throw` en producción.
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

export async function sincronizarStrava(
  deportistaId: number,
): Promise<{ error: string } | { ok: true; sincronizadas: number }> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const resultado = await sincronizarActividadesStrava(deportistaId);
  if (!resultado.ok) return { error: resultado.error ?? "Fallo al sincronizar con Strava" };
  return { ok: true, sincronizadas: resultado.sincronizadas };
}

export async function actualizarPerfilFisiologico(
  deportistaId: number,
  datos: {
    fcMaxRef: number | null;
    fcReposo: number | null;
    pesoRef: number | null;
    ftpCiclismoW: number | null;
    ftpCarreraW: number | null;
    ritmoUmbralSKm: number | null;
  },
): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const { error } = await r.supabase
    .from("deportistas")
    .update({
      fc_max_ref: datos.fcMaxRef,
      fc_reposo: datos.fcReposo,
      peso_ref: datos.pesoRef,
      ftp_ciclismo_w: datos.ftpCiclismoW,
      ftp_carrera_w: datos.ftpCarreraW,
      ritmo_umbral_s_km: datos.ritmoUmbralSKm,
    })
    .eq("id", deportistaId);
  if (error) return { error: error.message };
  return { ok: true };
}
