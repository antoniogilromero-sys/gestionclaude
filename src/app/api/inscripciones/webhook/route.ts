import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaDesdeBody } from "@/lib/inscripciones";

// Recibe una respuesta suelta del Google Forms de inscripción, enviada por
// el disparador `onFormSubmit` del Apps Script (ver
// docs/apps_script_inscripciones.gs). Se mantiene como red de seguridad
// por si el Apps Script no llegara a disparar la sincronización completa
// (`/api/inscripciones/sincronizar`, que es la que usa el Apps Script
// desde agosto 2026) — pero el flujo normal ya no depende solo de esto.
// Nunca lanza: siempre responde con un JSON { error } o { ok: true }, para
// que el Apps Script pueda saber si algo falló sin que Vercel oculte el motivo.

export async function POST(request: NextRequest) {
  const secretEsperado = process.env.INSCRIPCIONES_WEBHOOK_SECRET;
  if (!secretEsperado) {
    return NextResponse.json({ error: "Falta configurar INSCRIPCIONES_WEBHOOK_SECRET" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secretEsperado}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const fila = filaDesdeBody(body);
  if (!fila) {
    return NextResponse.json({ error: "Falta el nombre completo" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: inscripcion, error } = await supabase
    .from("inscripciones")
    .insert({
      email: fila.email,
      nombre_completo: fila.nombreCompleto,
      dni: fila.dni,
      fecha_nacimiento: fila.fechaNacimiento,
      domicilio: fila.domicilio,
      talla_camiseta: fila.tallaCamiseta,
      dias_piscina: fila.diasPiscina,
      proteccion_datos: fila.proteccionDatos,
      derechos_imagen: fila.derechosImagen,
      telefono: fila.telefono,
      email2: fila.email2,
      tarifa: fila.tarifa,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Da de alta al deportista automáticamente si no existe ya (sin grupo
  // ni categoría — eso lo rellena el director luego con el botón
  // "editar" en /deportistas), y vincula la inscripción con él para que
  // salga "Vinculada" en /inscripciones en vez de quedarse suelta.
  // `deportista_id_o_alta` (docs/migracion_matching_deportistas.sql)
  // compara nombres con unaccent+lower+trim, no con igualdad exacta —
  // así un espacio de más o un acento distinto no crea un duplicado.
  try {
    const { data: deportistaId, error: errorFn } = await supabase.rpc("deportista_id_o_alta", {
      p_nombre: fila.nombreCompleto,
    });
    if (errorFn) throw errorFn;
    if (deportistaId) {
      await supabase
        .from("inscripciones")
        .update({ deportista_id: deportistaId })
        .eq("id", inscripcion.id);
    }
  } catch (e) {
    // No hace fallar el webhook por esto: la inscripción ya se guardó,
    // que es lo importante. Si falla el alta/vínculo automático, el
    // director siempre puede darlo de alta y vincularlo a mano.
    console.error("Alta/vínculo automático de deportista fallido:", e);
  }

  return NextResponse.json({ ok: true });
}
