"use server";

import { createClient } from "@/lib/supabase/server";

type Resultado = { error: string } | { ok: true };

// Director y entrenador pueden registrar RPE — son quienes están presentes
// en el entrenamiento del día a día. Nunca lanza: Next.js oculta el
// mensaje de un `throw` en producción.
async function requireAprobado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado" };
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", user.id)
    .single();
  if (!perfil || !perfil.activo || perfil.rol === "pendiente") {
    return { ok: false as const, error: "No autorizado" };
  }
  return { ok: true as const, supabase, userId: user.id };
}

export async function guardarRpe(input: {
  stravaActividadId: number;
  deportistaId: number;
  rpe: number;
  notas: string;
}): Promise<Resultado> {
  const r = await requireAprobado();
  if (!r.ok) return { error: r.error };

  if (!(input.rpe >= 1 && input.rpe <= 10)) {
    return { error: "El RPE tiene que estar entre 1 y 10" };
  }

  const { error } = await r.supabase.from("strava_rpe").upsert({
    strava_actividad_id: input.stravaActividadId,
    deportista_id: input.deportistaId,
    rpe: input.rpe,
    notas: input.notas.trim() || null,
    registrado_por: r.userId,
    actualizado_en: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  return { ok: true };
}
