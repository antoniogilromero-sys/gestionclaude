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

export async function cambiarGrupo(deportistaId: number, grupoId: number | null) {
  const supabase = await requireDirector();
  const { error } = await supabase
    .from("deportistas")
    .update({ grupo_id: grupoId })
    .eq("id", deportistaId);
  if (error) throw new Error(error.message);
}

export async function cambiarActivo(deportistaId: number, activo: boolean) {
  const supabase = await requireDirector();
  const { error } = await supabase
    .from("deportistas")
    .update({ activo })
    .eq("id", deportistaId);
  if (error) throw new Error(error.message);
}

export async function altaDeportista(input: {
  ref: string;
  nombre: string;
  categoria: string;
  grupoId: number | null;
}) {
  const supabase = await requireDirector();
  if (!input.nombre.trim()) throw new Error("Falta el nombre");
  const { error } = await supabase.from("deportistas").insert({
    ref: input.ref.trim() || null,
    nombre: input.nombre.trim(),
    categoria: input.categoria.trim() || null,
    grupo_id: input.grupoId,
  });
  if (error) throw new Error(error.message);
}
