"use server";

import { createClient } from "@/lib/supabase/server";
import { sincronizarPagosCuotas } from "@/lib/stripe";

// Nunca lanza: Next.js oculta el mensaje de un `throw` en producción.
export async function sincronizarPagos(): Promise<
  { error: string } | { actualizados: number }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || perfil.rol !== "director") return { error: "Solo el director puede hacer esto" };

  try {
    return await sincronizarPagosCuotas();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se ha podido sincronizar con Stripe" };
  }
}
