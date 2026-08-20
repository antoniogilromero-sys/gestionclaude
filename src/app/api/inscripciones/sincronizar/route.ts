import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filaDesdeBody, normalizarNombre, type FilaFormulario } from "@/lib/inscripciones";

// Sincroniza TODA la hoja de respuestas del Google Forms de inscripción
// de una vez: inserta lo nuevo, actualiza lo que haya cambiado y BORRA de
// /inscripciones lo que ya no esté en la hoja (una fila de prueba que se
// borró a mano en el Sheet, por ejemplo). A diferencia de
// /api/inscripciones/webhook (que solo añade la respuesta que acaba de
// llegar), esto hace que Administración > Inscripciones sea siempre un
// espejo exacto del Google Sheet — es lo que pidió Antón explícitamente
// (agosto 2026): "tiene que aparecer exactamente lo que está en el
// Excel... evitar duplicados".
//
// Lo dispara el Apps Script (docs/apps_script_inscripciones.gs) cada vez
// que llega una respuesta nueva al formulario: en vez de mandar solo esa
// fila, relee la hoja entera y manda todas las filas de golpe. El
// emparejamiento con lo que ya hay en la tabla es por nombre normalizado
// (sin acentos/mayúsculas/espacios de más, `normalizarNombre` en
// src/lib/inscripciones.ts) — no hay ningún id estable que venga del
// Sheet para hacerlo más fino.

export const maxDuration = 60;

// Por debajo de esto, se rechaza sin tocar nada: si el Apps Script no
// llegó a leer bien la hoja (por lo que sea) y manda un array casi
// vacío, lo último que queremos es borrar toda la tabla de inscripciones
// por error.
const MINIMO_FILAS = 10;

// Cuántas filas se procesan en paralelo — evita que sincronizar ~100
// filas sea 100 idas y vueltas seguidas a Supabase (podría acercarse al
// límite de tiempo de la función), pero sin lanzar todas a la vez.
const TAMANO_LOTE = 8;

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

  const filasBody = Array.isArray(body.filas) ? body.filas : null;
  if (!filasBody) {
    return NextResponse.json({ error: "Falta el array 'filas'" }, { status: 400 });
  }

  // Limpia cada fila y descarta duplicados dentro de la propia hoja
  // (misma persona con dos respuestas), quedándose con la primera.
  const filas: FilaFormulario[] = [];
  const vistosEnHoja = new Set<string>();
  for (const item of filasBody) {
    if (typeof item !== "object" || item === null) continue;
    const fila = filaDesdeBody(item as Record<string, unknown>);
    if (!fila) continue;
    const clave = normalizarNombre(fila.nombreCompleto);
    if (vistosEnHoja.has(clave)) continue;
    vistosEnHoja.add(clave);
    filas.push(fila);
  }

  if (filas.length < MINIMO_FILAS) {
    return NextResponse.json(
      {
        error: `Solo llegaron ${filas.length} filas válidas (mínimo ${MINIMO_FILAS}) — no se toca nada por seguridad, puede que la hoja no se leyera bien.`,
      },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: existentes, error: errorLeer } = await supabase
    .from("inscripciones")
    .select("id, nombre_completo");
  if (errorLeer) return NextResponse.json({ error: errorLeer.message }, { status: 500 });

  const idPorNombre = new Map<string, number>();
  for (const fila of existentes ?? []) {
    idPorNombre.set(normalizarNombre(fila.nombre_completo), fila.id);
  }

  let insertados = 0;
  let actualizados = 0;
  const idsVistos = new Set<number>();

  async function procesarFila(fila: FilaFormulario) {
    const clave = normalizarNombre(fila.nombreCompleto);
    const datos = {
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
    };

    let id = idPorNombre.get(clave);
    if (id) {
      const { error } = await supabase.from("inscripciones").update(datos).eq("id", id);
      if (error) {
        console.error("Error actualizando inscripción:", fila.nombreCompleto, error);
        return;
      }
      actualizados++;
    } else {
      const { data, error } = await supabase.from("inscripciones").insert(datos).select("id").single();
      if (error || !data) {
        console.error("Error insertando inscripción:", fila.nombreCompleto, error);
        return;
      }
      id = data.id as number;
      insertados++;
    }
    if (id === undefined) return;
    idsVistos.add(id);

    // Misma alta/vínculo automático de deportista que el webhook de una
    // sola fila (docs/migracion_matching_deportistas.sql).
    try {
      const { data: deportistaId, error: errorFn } = await supabase.rpc("deportista_id_o_alta", {
        p_nombre: fila.nombreCompleto,
      });
      if (!errorFn && deportistaId) {
        await supabase.from("inscripciones").update({ deportista_id: deportistaId }).eq("id", id);
      }
    } catch (e) {
      console.error("Alta/vínculo automático de deportista fallido:", fila.nombreCompleto, e);
    }
  }

  for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
    await Promise.all(filas.slice(i, i + TAMANO_LOTE).map(procesarFila));
  }

  // Borra lo que ya no está en la hoja — la parte que hacía que antes
  // "no estuvieran vinculados ni actualizados" según lo reportó Antón:
  // filas sueltas de pruebas, respuestas borradas a mano en el Sheet, etc.
  const idsABorrar = (existentes ?? []).map((f) => f.id).filter((id) => !idsVistos.has(id));
  let borrados = 0;
  if (idsABorrar.length > 0) {
    const { error } = await supabase.from("inscripciones").delete().in("id", idsABorrar);
    if (!error) borrados = idsABorrar.length;
    else console.error("Error borrando inscripciones obsoletas:", error);
  }

  return NextResponse.json({ ok: true, total: filas.length, insertados, actualizados, borrados });
}
