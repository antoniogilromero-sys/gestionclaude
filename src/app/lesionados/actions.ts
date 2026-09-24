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

export async function crearLesion(input: {
  deportistaId: number;
  fechaLesion: string;
  zona: string;
  descripcion: string;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  if (!input.deportistaId) return { error: "Falta elegir el deportista" };
  if (!input.fechaLesion) return { error: "Falta la fecha de la lesión" };
  if (!input.descripcion.trim()) return { error: "Falta describir la lesión" };

  const { error } = await r.supabase.from("lesiones").insert({
    deportista_id: input.deportistaId,
    fecha_lesion: input.fechaLesion,
    zona: input.zona.trim() || null,
    descripcion: input.descripcion.trim(),
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function marcarRecuperado(id: number, recuperado: boolean): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const { error } = await r.supabase
    .from("lesiones")
    .update({
      estado: recuperado ? "recuperado" : "activa",
      fecha_recuperacion: recuperado ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarLesion(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const { error } = await r.supabase.from("lesiones").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function anadirSeguimiento(input: {
  lesionId: number;
  fecha: string;
  nota: string;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  if (!input.fecha) return { error: "Falta la fecha" };
  if (!input.nota.trim()) return { error: "Falta la nota" };

  const { error } = await r.supabase.from("lesion_seguimiento").insert({
    lesion_id: input.lesionId,
    fecha: input.fecha,
    nota: input.nota.trim(),
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarSeguimiento(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const { error } = await r.supabase.from("lesion_seguimiento").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
