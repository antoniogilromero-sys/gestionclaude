// Cálculo de coste de entrenadores, compartido entre /reparto y /pagos
// para que las dos pantallas usen siempre la misma tarifa y las mismas
// horas — si algún día cambia una tarifa general, se cambia aquí una vez.

// Sin excepción propia en tarifas_entrenador, se paga esto por hora.
// "fuerza" a 15 €/h confirmado por Antón (no salía de ningún cálculo).
export const TARIFA_GENERAL: Record<string, number> = {
  natacion: 15,
  carrera: 15,
  ciclismo: 20,
  fuerza: 15,
};

export type Grupo = {
  id: number;
  nombre: string;
  disciplina: string;
  dias: string[];
  hora_inicio: string | null;
  hora_fin: string | null;
  orden?: number | null;
};

export type Tarifa = { entrenador_id: string; disciplina: string; euros_hora: number };

// Grupos que Antón pidió explícitamente dejar a 0€/hora para quien sea
// que los cubra, sin excepción de entrenador — no es una tarifa general
// ni una tarifa por entrenador, es una tarifa por GRUPO concreto (algo
// que hasta ahora no hacía falta modelar). Comparación en minúsculas
// para no depender de que el nombre esté escrito con las mayúsculas
// exactas en la base de datos.
const GRUPOS_SIN_PAGO = new Set(["martes avanzado 19h", "jueves avanzado 19h"]);

// Excepción más fina que GRUPOS_SIN_PAGO: aquí no es "este grupo no se
// paga a nadie", es "a esta persona en concreto no se le paga por dar
// este grupo en concreto" — otro entrenador que cubra el mismo grupo sí
// cobra lo normal. Pedido por Antón para Diego Gil Gordillo en los dos
// grupos de Atletismo de Iniciación del lunes (1A y 1B).
const GRUPO_ENTRENADOR_SIN_PAGO = [
  { grupo: "atletismo 1a lunes", entrenador: "diego gil gordillo" },
  { grupo: "atletismo 1b lunes", entrenador: "diego gil gordillo" },
];

export function tarifaDe(
  entrenadorId: string,
  disciplina: string,
  tarifas: Tarifa[],
  nombreGrupo?: string,
  nombreEntrenador?: string,
) {
  // Colapsa espacios de más además de mayúsculas — "Diego Gil  Gordillo"
  // (con doble espacio, que es justo el fallo que ya dio problemas en
  // Deportistas) tiene que seguir encajando con "Diego Gil Gordillo".
  const normaliza = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const grupoClave = nombreGrupo ? normaliza(nombreGrupo) : undefined;
  const entrenadorClave = nombreEntrenador ? normaliza(nombreEntrenador) : undefined;

  if (grupoClave && GRUPOS_SIN_PAGO.has(grupoClave)) return 0;
  if (
    grupoClave &&
    entrenadorClave &&
    GRUPO_ENTRENADOR_SIN_PAGO.some((x) => x.grupo === grupoClave && x.entrenador === entrenadorClave)
  ) {
    return 0;
  }

  const propia = tarifas.find(
    (t) => t.entrenador_id === entrenadorId && t.disciplina === disciplina,
  );
  if (propia) return propia.euros_hora;
  return TARIFA_GENERAL[disciplina] ?? null;
}

// Horas que supone un grupo en una semana: duración de la sesión × cuántos
// días a la semana se hace. Un grupo sin horario fijo (ej. Ciclismo
// Carretera del domingo) devuelve null: no se puede calcular su coste
// hasta que tenga horas.
export const DISCIPLINA_LABEL: Record<string, string> = {
  natacion: "Natación",
  carrera: "Carrera",
  ciclismo: "Ciclismo",
  fuerza: "Fuerza",
};

export const DISCIPLINA_TAG: Record<string, string> = {
  natacion: "bg-swim/15 text-swim",
  carrera: "bg-run/15 text-run",
  ciclismo: "bg-bike/15 text-bike",
  fuerza: "bg-signal/15 text-signal",
};

export function horasSemanales(g: Grupo) {
  if (!g.hora_inicio || !g.hora_fin) return null;
  const [h1, m1] = g.hora_inicio.split(":").map(Number);
  const [h2, m2] = g.hora_fin.split(":").map(Number);
  const horasPorSesion = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  return horasPorSesion * g.dias.length;
}
