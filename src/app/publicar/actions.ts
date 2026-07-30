"use server";

import { createClient } from "@/lib/supabase/server";

export async function publicarSesion(input: {
  titulo: string;
  fecha: string;
  disciplina: string;
  contenido: string;
  material: string;
  grupoIds: number[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  if (!input.titulo.trim() || !input.contenido.trim() || input.grupoIds.length === 0) {
    throw new Error("Faltan título, contenido o grupos");
  }

  const { data: sesion, error } = await supabase
    .from("sesiones")
    .insert({
      titulo: input.titulo.trim(),
      fecha: input.fecha,
      disciplina: input.disciplina,
      contenido: input.contenido.trim(),
      material: input.material.trim() || null,
      autor_id: user.id,
      publicada: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const filas = input.grupoIds.map((grupoId) => ({
    sesion_id: sesion.id,
    grupo_id: grupoId,
  }));
  const { error: eGrupos } = await supabase.from("sesion_grupo").insert(filas);
  if (eGrupos) throw new Error(eGrupos.message);

  return sesion.id as number;
}
