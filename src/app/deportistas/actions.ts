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

export async function cambiarGrupo(deportistaId: number, grupoId: number | null): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase
    .from("deportistas")
    .update({ grupo_id: grupoId })
    .eq("id", deportistaId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function cambiarActivo(deportistaId: number, activo: boolean): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase
    .from("deportistas")
    .update({ activo })
    .eq("id", deportistaId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function altaDeportista(input: {
  ref: string;
  nombre: string;
  categoria: string;
  grupoId: number | null;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  if (!input.nombre.trim()) return { error: "Falta el nombre" };
  const { error } = await r.supabase.from("deportistas").insert({
    ref: input.ref.trim() || null,
    nombre: input.nombre.trim(),
    categoria: input.categoria.trim() || null,
    grupo_id: input.grupoId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
