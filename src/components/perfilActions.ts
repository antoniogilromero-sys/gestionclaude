"use server";

import { createClient } from "@/lib/supabase/server";

// Nunca lanza: Next.js oculta el mensaje de un `throw` en producción.
export async function cambiarMiNombre(nombre: string): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const limpio = nombre.trim();
  if (!limpio) return { error: "El nombre no puede estar vacío" };

  const { error } = await supabase.from("perfiles").update({ nombre: limpio }).eq("id", user.id);
  if (error) return { error: error.message };
  return { ok: true };
}
