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

export async function crearPedido(input: {
  deportistaId: number;
  articulo: "camiseta" | "sudadera";
  talla: string;
  cantidad: number;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  if (!input.deportistaId) return { error: "Falta elegir el deportista" };
  if (!input.talla.trim()) return { error: "Falta la talla" };
  if (!(input.cantidad > 0)) return { error: "La cantidad tiene que ser mayor que cero" };

  const { error } = await r.supabase.from("pedidos").insert({
    deportista_id: input.deportistaId,
    articulo: input.articulo,
    talla: input.talla.trim(),
    cantidad: input.cantidad,
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarPedido(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const { error } = await r.supabase.from("pedidos").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
