"use server";

import { createClient } from "@/lib/supabase/server";

export async function setAsignacion(
  semana: string,
  grupoId: number,
  entrenadorId: string,
  asignar: boolean,
) {
  const supabase = await createClient();

  if (asignar) {
    const { error } = await supabase
      .from("asignaciones")
      .insert({ semana, grupo_id: grupoId, entrenador_id: entrenadorId });
    if (error && error.code !== "23505") throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("asignaciones")
      .delete()
      .eq("semana", semana)
      .eq("grupo_id", grupoId)
      .eq("entrenador_id", entrenadorId);
    if (error) throw new Error(error.message);
  }
}

export async function copiarSemanaAnterior(
  semanaDestino: string,
  semanaOrigen: string,
) {
  const supabase = await createClient();

  const { data: origen, error: eOrigen } = await supabase
    .from("asignaciones")
    .select("grupo_id, entrenador_id")
    .eq("semana", semanaOrigen);
  if (eOrigen) throw new Error(eOrigen.message);

  if (!origen || origen.length === 0) {
    // No hay nada que copiar: no tocamos la semana destino para no borrarla por error.
    return { copiado: false, filas: 0 };
  }

  const { error: eDel } = await supabase
    .from("asignaciones")
    .delete()
    .eq("semana", semanaDestino);
  if (eDel) throw new Error(eDel.message);

  const filas = origen.map((r) => ({
    semana: semanaDestino,
    grupo_id: r.grupo_id,
    entrenador_id: r.entrenador_id,
  }));
  const { error: eIns } = await supabase.from("asignaciones").insert(filas);
  if (eIns) throw new Error(eIns.message);

  return { copiado: true, filas: filas.length };
}
