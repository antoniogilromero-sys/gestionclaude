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

export async function crearJornada(input: {
  anio: number;
  colegio: string;
  fechaHorario: string;
  disciplina: string;
  contacto: string;
  entrenadorIds: string[];
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const colegio = input.colegio.trim();
  const fechaHorario = input.fechaHorario.trim();
  const disciplina = input.disciplina.trim();

  if (!colegio || !fechaHorario || !disciplina) {
    return { error: "Faltan el colegio, la fecha/horario o la disciplina" };
  }
  if (!(input.anio > 2000)) return { error: "El año no es válido" };

  const { data: jornada, error } = await r.supabase
    .from("jornadas_colegios")
    .insert({
      anio: input.anio,
      colegio,
      fecha_horario: fechaHorario,
      disciplina,
      contacto: input.contacto.trim() || null,
      creado_por: r.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (input.entrenadorIds.length > 0) {
    const filas = input.entrenadorIds.map((entrenadorId) => ({
      jornada_id: jornada.id,
      entrenador_id: entrenadorId,
    }));
    const { error: eEntrenadores } = await r.supabase.from("jornada_entrenador").insert(filas);
    if (eEntrenadores) return { error: eEntrenadores.message };
  }

  return { ok: true };
}

export async function borrarJornada(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("jornadas_colegios").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
