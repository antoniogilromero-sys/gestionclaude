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

export async function crearCompeticion(input: {
  deportistaId: number;
  anio: number;
  nombreCarrera: string;
  fecha: string;
  disciplina: string;
  tiempo: string;
  clasificacion: string;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const nombreCarrera = input.nombreCarrera.trim();
  const disciplina = input.disciplina.trim();
  if (!input.deportistaId) return { error: "Falta elegir el deportista" };
  if (!nombreCarrera) return { error: "Falta el nombre de la carrera" };
  if (!disciplina) return { error: "Falta la disciplina" };
  if (!(input.anio > 2000)) return { error: "El año no es válido" };

  const { error } = await r.supabase.from("competiciones").insert({
    deportista_id: input.deportistaId,
    anio: input.anio,
    nombre_carrera: nombreCarrera,
    fecha: input.fecha || null,
    disciplina,
    tiempo: input.tiempo.trim() || null,
    clasificacion: input.clasificacion.trim() || null,
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarCompeticion(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("competiciones").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function crearProximaCompeticion(input: {
  nombre: string;
  fecha: string;
  lugar: string;
  disciplina: string;
  notas: string;
  esEscolar: boolean;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const nombre = input.nombre.trim();
  const disciplina = input.disciplina.trim();
  if (!nombre) return { error: "Falta el nombre de la carrera" };
  if (!disciplina) return { error: "Falta la disciplina" };

  const { error } = await r.supabase.from("proximas_competiciones").insert({
    nombre,
    fecha: input.fecha || null,
    lugar: input.lugar.trim() || null,
    disciplina,
    notas: input.notas.trim() || null,
    es_escolar: input.esEscolar,
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarProximaCompeticion(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("proximas_competiciones").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
