import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Recibe cada respuesta nueva del Google Forms de inscripción, enviada por
// el Apps Script de la hoja de respuestas (ver docs/apps_script_inscripciones.gs).
// Nunca lanza: siempre responde con un JSON { error } o { ok: true }, para
// que el Apps Script pueda saber si algo falló sin que Vercel oculte el motivo.

function parseFecha(valor: string | undefined): string | null {
  if (!valor) return null;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(valor)) return valor;
  const dmy = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
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
  if (!email || !nombreCompleto) {
    return NextResponse.json({ error: "Faltan email o nombre completo" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("inscripciones").insert({
    email,
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
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
