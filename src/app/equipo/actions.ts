"use server";

import { createClient } from "@/lib/supabase/server";

async function requireDirector() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.rol !== "director") throw new Error("Solo el director puede hacer esto");
  return supabase;
}

export async function aprobarEntrenador(perfilId: string) {
  const supabase = await requireDirector();
  const { error } = await supabase
    .from("perfiles")
    .update({ rol: "entrenador", activo: true })
    .eq("id", perfilId);
  if (error) throw new Error(error.message);
}

export async function darDeBaja(perfilId: string) {
  const supabase = await requireDirector();
  const { error } = await supabase.from("perfiles").update({ activo: false }).eq("id", perfilId);
  if (error) throw new Error(error.message);
}

export async function reactivar(perfilId: string) {
  const supabase = await requireDirector();
  const { error } = await supabase.from("perfiles").update({ activo: true }).eq("id", perfilId);
  if (error) throw new Error(error.message);
}
