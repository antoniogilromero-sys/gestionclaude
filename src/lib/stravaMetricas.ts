// Cálculos de carga de entrenamiento a partir de datos de Strava.
// Fórmulas estándar del sector, no inventadas aquí:
//   - NP / IF / VI / TSS: modelo de Andrew Coggan (TrainingPeaks), el
//     estándar de facto en ciclismo con potenciómetro.
//   - GAP (ritmo ajustado a la pendiente): coste energético de correr
//     según la pendiente, modelo de Minetti et al. 2002.
//   - Deriva de FC (desacople cardíaco): comparar el ratio
//     rendimiento/FC entre la 1ª y la 2ª mitad de la sesión — método
//     habitual para detectar falta de base aeróbica (ej. TrainerRoad,
//     Fast Talk Labs).
//
// Todas son funciones puras: no tocan la base de datos ni la red, solo
// reciben números y devuelven números (o null si falta algún dato).

export function calcularIF(np: number | null, ftp: number | null): number | null {
  if (np == null || !ftp) return null;
  return np / ftp;
}

export function calcularVI(np: number | null, potenciaMedia: number | null): number | null {
  if (np == null || !potenciaMedia) return null;
  return np / potenciaMedia;
}

// TSS = (duración_s × NP × IF) / (FTP × 3600) × 100
export function calcularTSS(
  duracionS: number,
  np: number | null,
  ftp: number | null,
): number | null {
  const ifactor = calcularIF(np, ftp);
  if (np == null || !ftp || ifactor == null) return null;
  return (duracionS * np * ifactor) / (ftp * 3600) * 100;
}

// Coste energético de correr sobre una pendiente `i` (decimal, ej. 0.05 =
// 5%), relativo al llano — Minetti et al. 2002, "Energy cost of walking
// and running at extreme uphill and downhill slopes".
export function costeMinetti(pendienteDecimal: number): number {
  const i = pendienteDecimal;
  return (
    155.4 * i ** 5 -
    30.4 * i ** 4 -
    43.3 * i ** 3 +
    46.3 * i ** 2 +
    19.5 * i +
    3.6
  );
}

export type PuntoStream = {
  tiempo_s: number;
  distancia_m: number;
  velocidad_ms: number | null;
  pendiente_pct: number | null;
  fc: number | null;
  potencia_w: number | null;
};

// Ritmo ajustado a la pendiente (GAP): en cada tramo del stream, la
// distancia real se "convierte" a la distancia equivalente que costaría
// correr en llano al mismo esfuerzo, según el coste de Minetti. El GAP es
// el ritmo medio resultante sobre esa distancia equivalente.
export function calcularGAP(puntos: PuntoStream[]): number | null {
  if (puntos.length < 2) return null;
  const costeLlano = costeMinetti(0);
  let distanciaEquivalente = 0;
  let tiempoTotal = 0;

  for (let i = 1; i < puntos.length; i++) {
    const dt = puntos[i].tiempo_s - puntos[i - 1].tiempo_s;
    const dd = puntos[i].distancia_m - puntos[i - 1].distancia_m;
    if (dt <= 0 || dd <= 0) continue;
    const pendiente = (puntos[i].pendiente_pct ?? 0) / 100;
    const factor = costeMinetti(pendiente) / costeLlano;
    distanciaEquivalente += dd * factor;
    tiempoTotal += dt;
  }
  if (distanciaEquivalente <= 0 || tiempoTotal <= 0) return null;
  // segundos por km sobre la distancia equivalente
  return tiempoTotal / (distanciaEquivalente / 1000);
}

// Desacople cardíaco: compara el ratio "salida / FC" entre la 1ª y la 2ª
// mitad de la sesión. "Salida" es potencia si hay potenciómetro, si no,
// velocidad. Un valor positivo alto (>5-10%) indica que el corazón tuvo
// que trabajar más para mantener el mismo ritmo/potencia según avanzaba
// la sesión — señal de falta de resistencia aeróbica de base.
export function calcularDerivaFC(puntos: PuntoStream[]): number | null {
  const validos = puntos.filter((p) => p.fc != null && (p.potencia_w != null || p.velocidad_ms != null));
  if (validos.length < 20) return null; // sesión demasiado corta/con pocos datos para dividir en dos

  const mitad = Math.floor(validos.length / 2);
  const primera = validos.slice(0, mitad);
  const segunda = validos.slice(mitad);

  function ratioMedio(tramo: PuntoStream[]): number | null {
    const salida = tramo.map((p) => p.potencia_w ?? p.velocidad_ms ?? 0);
    const fc = tramo.map((p) => p.fc ?? 0);
    const salidaMedia = salida.reduce((s, v) => s + v, 0) / salida.length;
    const fcMedia = fc.reduce((s, v) => s + v, 0) / fc.length;
    if (!fcMedia) return null;
    return salidaMedia / fcMedia;
  }

  const r1 = ratioMedio(primera);
  const r2 = ratioMedio(segunda);
  if (r1 == null || r2 == null || r1 === 0) return null;
  return ((r1 - r2) / r1) * 100;
}

// ------------------------------------------ CARGA DE ENTRENAMIENTO (PMC)

// CTL/ATL/TSB — el "gráfico de gestión del rendimiento" (Performance
// Management Chart) que hizo popular TrainingPeaks, modelo de Banister
// (impulso-respuesta) simplificado con medias móviles exponenciales:
//   - CTL ("Forma física"): media móvil exponencial de 42 días del TSS
//     diario — carga acumulada de las últimas ~6 semanas.
//   - ATL ("Fatiga"): lo mismo a 7 días — sube y baja mucho más rápido.
//   - TSB ("Forma"): CTL − ATL. Positivo = fresco/descansado, muy
//     negativo = muy fatigado, cerca de cero = en plena carga.
// Ambas arrancan en 0 el primer día con datos (simplificación estándar:
// no se conoce la carga de antes de esa fecha).
export type PuntoCarga = {
  fecha: string; // YYYY-MM-DD
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
};

export function calcularCargaEntrenamiento(
  actividades: { fecha: string; tss: number | null }[],
): PuntoCarga[] {
  const tssPorDia = new Map<string, number>();
  for (const a of actividades) {
    if (a.tss == null) continue;
    const dia = a.fecha.slice(0, 10);
    tssPorDia.set(dia, (tssPorDia.get(dia) ?? 0) + a.tss);
  }
  if (tssPorDia.size === 0) return [];

  const dias = [...tssPorDia.keys()].sort();
  const cursor = new Date(dias[0] + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const puntos: PuntoCarga[] = [];
  let ctl = 0;
  let atl = 0;
  while (cursor <= hoy) {
    const clave = cursor.toISOString().slice(0, 10);
    const tssDia = tssPorDia.get(clave) ?? 0;
    ctl += (tssDia - ctl) / 42;
    atl += (tssDia - atl) / 7;
    puntos.push({
      fecha: clave,
      tss: Math.round(tssDia * 10) / 10,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round((ctl - atl) * 10) / 10,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return puntos;
}
