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

export async function crearHorario(input: {
  categoria: string;
  dia: string;
  disciplina: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  notas: string;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const categoria = input.categoria.trim();
  const disciplina = input.disciplina.trim();
  if (!categoria) return { error: "Falta la categoría" };
  if (!input.dia) return { error: "Falta el día" };
  if (!disciplina) return { error: "Falta la disciplina" };
  if (!input.horaInicio) return { error: "Falta la hora de inicio" };

  const { error } = await r.supabase.from("horarios_entrenamiento").insert({
    categoria,
    dia: input.dia,
    disciplina,
    hora_inicio: input.horaInicio,
    hora_fin: input.horaFin || null,
    lugar: input.lugar.trim() || null,
    notas: input.notas.trim() || null,
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarHorario(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("horarios_entrenamiento").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
