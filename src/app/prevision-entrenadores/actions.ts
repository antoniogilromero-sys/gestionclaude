"use server";

import { createClient } from "@/lib/supabase/server";

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

export async function crearPrevision(input: {
  dia: string;
  horaInicio: string;
  horaFin: string;
  entrenador: string;
  grupo: string;
  disciplina: string;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const entrenador = input.entrenador.trim();
  if (!entrenador) return { error: "Falta el entrenador" };
  if (!input.horaInicio) return { error: "Falta la hora de inicio" };
  if (!input.disciplina) return { error: "Falta la disciplina" };

  const { error } = await r.supabase.from("prevision_entrenadores").insert({
    dia: input.dia,
    hora_inicio: input.horaInicio,
    hora_fin: input.horaFin || null,
    entrenador,
    grupo: input.grupo.trim() || null,
    disciplina: input.disciplina,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarPrevision(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("prevision_entrenadores").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
