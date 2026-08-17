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
};

export type Tarifa = { entrenador_id: string; disciplina: string; euros_hora: number };

export function tarifaDe(entrenadorId: string, disciplina: string, tarifas: Tarifa[]) {
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
