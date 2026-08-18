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

export async function crearMovimiento(input: {
  tipo: "ingreso" | "gasto";
  categoria: string;
  concepto: string;
  importe: number;
  fecha: string;
}): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };

  const categoria = input.categoria.trim();
  if (!categoria) return { error: "Falta la categoría" };
  if (!(input.importe > 0)) return { error: "El importe tiene que ser mayor que cero" };
  if (!input.fecha) return { error: "Falta la fecha" };

  const { error } = await r.supabase.from("movimientos_club").insert({
    tipo: input.tipo,
    categoria,
    concepto: input.concepto.trim() || null,
    importe: input.importe,
    fecha: input.fecha,
    creado_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarMovimiento(id: number): Promise<Resultado> {
  const r = await requireDirector();
  if (!r.ok) return { error: r.error };
  const { error } = await r.supabase.from("movimientos_club").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
