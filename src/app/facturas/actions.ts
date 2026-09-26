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

// ------------------------------------------------ ARCHIVO DE DOCUMENTOS
// PDF/imágenes de facturas guardadas aparte de las que emite la app. El
// archivo se sube directo desde el navegador al bucket; aquí solo se
// registra el nombre y la ruta.

type ResultadoDoc = { error: string } | { ok: true };

async function directorDoc() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" } as const;
  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();
  if (!perfil || perfil.rol !== "director") {
    return { ok: false, error: "Solo el director puede hacer esto" } as const;
  }
  return { ok: true, supabase, userId: user.id } as const;
}

export async function crearDocumentoFactura(input: {
  nombre: string;
  storagePath: string;
}): Promise<ResultadoDoc> {
  const r = await directorDoc();
  if (!r.ok) return { error: r.error };
  if (!input.nombre.trim() || !input.storagePath.trim()) {
    return { error: "Falta el nombre o la ruta del archivo" };
  }
  const { error } = await r.supabase.from("facturas_documentos").insert({
    nombre: input.nombre.trim(),
    storage_path: input.storagePath,
    subido_por: r.userId,
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function borrarDocumentoFactura(id: number, storagePath: string): Promise<ResultadoDoc> {
  const r = await directorDoc();
  if (!r.ok) return { error: r.error };
  await r.supabase.storage.from("facturas-documentos").remove([storagePath]);
  const { error } = await r.supabase.from("facturas_documentos").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
