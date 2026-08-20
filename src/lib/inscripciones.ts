// Helpers compartidos entre los dos endpoints que reciben datos del
// Google Forms de inscripción: el webhook de una respuesta suelta
// (`/api/inscripciones/webhook`) y la sincronización completa de toda
// la hoja (`/api/inscripciones/sincronizar`). Antes vivían duplicados en
// el primero; se sacaron aquí al construir el segundo.

export function limpiar(valor: unknown): string | null {
  return typeof valor === "string" ? valor.trim() || null : null;
}

// Algunas fechas del Excel/Forms original vienen mal escritas (ej.
// "8/29/0013", mes 29 o año a cuatro dígitos incompleto) — en vez de que
// eso rompa el insert entero con un error de Postgres, se descarta esa
// fecha en concreto y se deja en blanco, para no perder el resto de los
// datos de esa persona.
function fechaValida(y: string, m: string, d: string): boolean {
  const anio = Number(y);
  const mes = Number(m);
  const dia = Number(d);
  return anio >= 1920 && anio <= 2026 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31;
}

export function parseFecha(valor: string | undefined | null): string | null {
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

// Equivalente en JS de `unaccent(lower(trim(x)))` en Postgres — mismo
// criterio de comparación de nombres que se usa en todo el proyecto
// (SQL de cargas, backfills, etc.), pero hace falta también en JS
// porque supabase-js no puede llamar a `unaccent()` dentro de un
// `.filter()` sin pasar por una función RPC para cada comparación.
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export type FilaFormulario = {
  email: string | null;
  nombreCompleto: string;
  dni: string | null;
  fechaNacimiento: string | null;
  domicilio: string | null;
  tallaCamiseta: string | null;
  diasPiscina: string | null;
  proteccionDatos: string | null;
  derechosImagen: string | null;
  telefono: string | null;
  email2: string | null;
  tarifa: string | null;
};

export function filaDesdeBody(body: Record<string, unknown>): FilaFormulario | null {
  const nombreCompleto = limpiar(body.nombreCompleto);
  if (!nombreCompleto) return null;
  return {
    email: limpiar(body.email),
    nombreCompleto,
    dni: limpiar(body.dni),
    fechaNacimiento: parseFecha(typeof body.fechaNacimiento === "string" ? body.fechaNacimiento : null),
    domicilio: limpiar(body.domicilio),
    tallaCamiseta: limpiar(body.tallaCamiseta),
    diasPiscina: limpiar(body.diasPiscina),
    proteccionDatos: limpiar(body.proteccionDatos),
    derechosImagen: limpiar(body.derechosImagen),
    telefono: limpiar(body.telefono),
    email2: limpiar(body.email2),
    tarifa: limpiar(body.tarifa),
  };
}
