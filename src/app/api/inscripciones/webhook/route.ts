import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Recibe cada respuesta nueva del Google Forms de inscripción, enviada por
// el Apps Script de la hoja de respuestas (ver docs/apps_script_inscripciones.gs).
// Nunca lanza: siempre responde con un JSON { error } o { ok: true }, para
// que el Apps Script pueda saber si algo falló sin que Vercel oculte el motivo.

function parseFecha(valor: string | undefined): string | null {
  if (!valor) return null;
  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return fechaValida(y, m, d) ? valor : null;
  }
  const dmy = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    if (!fechaValida(y, m, d)) return null;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

// Algunas fechas del Excel original vienen mal escritas (ej. "8/29/0013",
// mes 29 o año a cuatro dígitos incompleto) — en vez de que eso rompa el
// insert entero con un error de Postgres, se descarta esa fecha en
// concreto y se deja en blanco, para no perder el resto de los datos de
// esa persona.
function fechaValida(y: string, m: string, d: string): boolean {
  const anio = Number(y);
  const mes = Number(m);
  const dia = Number(d);
  return anio >= 1920 && anio <= 2026 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31;
}

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

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const nombreCompleto = typeof body.nombreCompleto === "string" ? body.nombreCompleto.trim() : "";
  if (!nombreCompleto) {
    return NextResponse.json({ error: "Falta el nombre completo" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: inscripcion, error } = await supabase
    .from("inscripciones")
    .insert({
      email: email || null,
      nombre_completo: nombreCompleto,
      dni: typeof body.dni === "string" ? body.dni.trim() || null : null,
      fecha_nacimiento: parseFecha(typeof body.fechaNacimiento === "string" ? body.fechaNacimiento : undefined),
      domicilio: typeof body.domicilio === "string" ? body.domicilio.trim() || null : null,
      talla_camiseta: typeof body.tallaCamiseta === "string" ? body.tallaCamiseta.trim() || null : null,
      dias_piscina: typeof body.diasPiscina === "string" ? body.diasPiscina.trim() || null : null,
      proteccion_datos: typeof body.proteccionDatos === "string" ? body.proteccionDatos.trim() || null : null,
      derechos_imagen: typeof body.derechosImagen === "string" ? body.derechosImagen.trim() || null : null,
      telefono: typeof body.telefono === "string" ? body.telefono.trim() || null : null,
      email2: typeof body.email2 === "string" ? body.email2.trim() || null : null,
      tarifa: typeof body.tarifa === "string" ? body.tarifa.trim() || null : null,
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
      p_nombre: nombreCompleto,
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
