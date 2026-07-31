"use server";

import { createClient } from "@/lib/supabase/server";

export async function cambiarMiNombre(nombre: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const limpio = nombre.trim();
  if (!limpio) throw new Error("El nombre no puede estar vacío");

  const { error } = await supabase.from("perfiles").update({ nombre: limpio }).eq("id", user.id);
  if (error) throw new Error(error.message);
}
