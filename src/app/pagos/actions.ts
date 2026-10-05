"use server";

import { createClient } from "@/lib/supabase/server";

type Resultado = { error: string } | { ok: true };
type DirectorCheck =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
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
  return { ok: true, supabase, userId: user.id };
}

export async function crearPagoExtra(input: {
  entrenadorId: string;
  mes: string;
  concepto: string;
  importe: number;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const concepto = input.concepto.trim();
  if (!input.entrenadorId) return { error: "Falta elegir el entrenador" };
  if (!concepto) return { error: "Falta el concepto" };
  if (!(input.importe > 0)) return { error: "El importe tiene que ser mayor que cero" };

  const { error } = await r.supabase.from("pagos_extra").insert({
    entrenador_id: input.entrenadorId,
    mes: input.mes,
    concepto,
    importe: input.importe,
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarPagoExtra(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("pagos_extra").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

// Cantidad REAL que se abona a un entrenador en un mes (para compararla
// con la estimación de la app). Una sola por entrenador y mes: si ya
// existe, se sustituye.
export async function guardarPagoReal(input: {
  entrenadorId: string;
  mes: string;
  importe: number;
  nota: string;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  if (!input.entrenadorId) return { error: "Falta elegir el entrenador" };
  if (!(input.importe >= 0)) return { error: "El importe no es válido" };

  const { error } = await r.supabase.from("pagos_reales").upsert(
    {
      entrenador_id: input.entrenadorId,
      mes: input.mes,
      importe: input.importe,
      nota: input.nota.trim() || null,
      creado_por: r.userId,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "entrenador_id,mes" },
  );
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarPagoReal(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("pagos_reales").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
