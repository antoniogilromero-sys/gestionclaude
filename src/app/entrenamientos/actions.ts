"use server";

import { createClient } from "@/lib/supabase/server";

export async function marcarVisto(sesionId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  // El acuse es para saber qué entrenadores han abierto la sesión; que el
  // director la vea al revisarla no debe contar como "vista por un entrenador".
  if (perfil?.rol === "director") return;

  const { error } = await supabase
    .from("sesion_vista")
    .insert({ sesion_id: sesionId, entrenador_id: user.id });
  if (error && error.code !== "23505") throw new Error(error.message);
}
