"use server";

import { createClient } from "@/lib/supabase/server";

export async function emitirFactura(input: {
  pagadorNombre: string;
  pagadorNif: string;
  pagadorDireccion: string;
  concepto: string;
  importe: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const nombre = input.pagadorNombre.trim();
  const nif = input.pagadorNif.trim();
  const concepto = input.concepto.trim();

  if (!nombre || !nif || !concepto) {
    throw new Error("Faltan el nombre, el NIF o el concepto");
  }
  if (!(input.importe > 0)) {
    throw new Error("El importe tiene que ser mayor que cero");
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

  if (error) throw new Error(error.message);
  return data.numero as number;
}
