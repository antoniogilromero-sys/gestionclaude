"use server";

import { createClient } from "@/lib/supabase/server";

// Next.js oculta el mensaje real de cualquier `throw` dentro de una server
// action en producción (por seguridad, solo deja un "digest"). Para que el
// director vea el motivo real del fallo, esta acción NUNCA lanza: siempre
// devuelve { error } o el resultado.
export async function emitirFactura(input: {
  pagadorNombre: string;
  pagadorNif: string;
  pagadorDireccion: string;
  concepto: string;
  importe: number;
}): Promise<{ error: string } | { numero: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const nombre = input.pagadorNombre.trim();
  const nif = input.pagadorNif.trim();
  const concepto = input.concepto.trim();

  if (!nombre || !nif || !concepto) {
    return { error: "Faltan el nombre, el NIF o el concepto" };
  }
  if (!(input.importe > 0)) {
    return { error: "El importe tiene que ser mayor que cero" };
  }

  const { data, error } = await supabase
    .from("facturas")
    .insert({
      pagador_nombre: nombre,
      pagador_nif: nif,
      pagador_direccion: input.pagadorDireccion.trim() || null,
      concepto,
      importe: input.importe,
      creada_por: user.id,
    })
    .select("numero")
    .single();

  if (error) return { error: error.message };
  return { numero: data.numero as number };
}
