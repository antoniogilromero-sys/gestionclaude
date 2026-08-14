import { createAdminClient } from "@/lib/supabase/admin";
import { calcularDerivaFC, calcularGAP, calcularIF, calcularTSS, calcularVI, type PuntoStream } from "@/lib/stravaMetricas";

// Integración con la API de Strava. Un deportista se conecta una vez desde
// /strava-conectar/[id] (enlace público, sin login) y a partir de ahí se
// puede ver su resumen de entrenamientos en /analisis.
//
// Hay dos niveles:
//   - El resumen ligero (km, horas, ritmo, FC media) se pide en directo a
//     Strava cada vez que se abre la ficha — nada se guarda.
//   - Las métricas avanzadas (NP/IF/VI/TSS en ciclismo, GAP y deriva de FC
//     en carrera) sí que se guardan en `strava_actividades`, porque
//     calcularlas exige descargar el segundo a segundo de cada actividad
//     y pedirlo en directo cada vez agotaría el límite de Strava. Solo se
//     actualizan cuando el director pulsa "Sincronizar" en la ficha.
//
// STRAVA_CLIENT_ID y STRAVA_CLIENT_SECRET tienen que estar en las
// variables de entorno de Vercel (y en .env.local si se prueba en local).

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API = "https://www.strava.com/api/v3";

type TokenStrava = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
};

export async function intercambiarCodigoPorToken(code: string): Promise<TokenStrava> {
  // El endpoint de Strava espera application/x-www-form-urlencoded, no
  // JSON — con URLSearchParams como body, fetch pone ese Content-Type solo.
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID ?? "",
      client_secret: process.env.STRAVA_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Strava rechazó el código: ${await res.text()}`);
  return res.json();
}

type Conexion = {
  deportista_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

async function refrescarToken(conexion: Conexion): Promise<string> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID ?? "",
      client_secret: process.env.STRAVA_CLIENT_SECRET ?? "",
      refresh_token: conexion.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`No se pudo renovar el token de Strava: ${await res.text()}`);
  const nuevo: TokenStrava = await res.json();

  const supabase = createAdminClient();
  await supabase
    .from("strava_conexiones")
    .update({
      access_token: nuevo.access_token,
      refresh_token: nuevo.refresh_token,
      expires_at: nuevo.expires_at,
    })
    .eq("deportista_id", conexion.deportista_id);

  return nuevo.access_token;
}

async function tokenValido(deportistaId: number): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: conexion } = await supabase
    .from("strava_conexiones")
    .select("deportista_id, access_token, refresh_token, expires_at")
    .eq("deportista_id", deportistaId)
    .maybeSingle();
  if (!conexion) return null;

  // Los access_token de Strava duran unas 6h; con 2 minutos de margen
  // evitamos pedir con uno que caduque a mitad de la petición.
  const margenSegundos = 120;
  const ahora = Math.floor(Date.now() / 1000);
  if (conexion.expires_at > ahora + margenSegundos) return conexion.access_token;
  return refrescarToken(conexion);
}

// Mismas 3 disciplinas que usa el resto de la app (COLOR_DISC en
// AnalisisClient): así el resumen de Strava se organiza igual que
// Tests/Análisis, en vez de mezclar natación, bici y carrera en un totall.
export type Disciplina = "natacion" | "ciclismo" | "carrera" | "otro";

const TIPO_A_DISCIPLINA: Record<string, Disciplina> = {
  Swim: "natacion",
  Run: "carrera",
  TrailRun: "carrera",
  VirtualRun: "carrera",
  Ride: "ciclismo",
  VirtualRide: "ciclismo",
  EBikeRide: "ciclismo",
  GravelRide: "ciclismo",
  MountainBikeRide: "ciclismo",
  Handcycle: "ciclismo",
};

export function disciplinaDeStrava(tipo: string): Disciplina {
  return TIPO_A_DISCIPLINA[tipo] ?? "otro";
}

export type ActividadStrava = {
  id: number;
  nombre: string;
  tipo: string;
  disciplina: Disciplina;
  distancia_m: number;
  tiempo_s: number;
  fecha: string;
  desnivel_m: number;
  velocidad_media_ms: number | null;
  fc_media: number | null;
  fc_max: number | null;
};

type TotalesDisciplina = Record<Disciplina, { km: number; horas: number; sesiones: number }>;

function totalesVacios(): TotalesDisciplina {
  return {
    natacion: { km: 0, horas: 0, sesiones: 0 },
    ciclismo: { km: 0, horas: 0, sesiones: 0 },
    carrera: { km: 0, horas: 0, sesiones: 0 },
    otro: { km: 0, horas: 0, sesiones: 0 },
  };
}

export type ResumenStrava = {
  conectado: boolean;
  actividades: ActividadStrava[];
  totalesPorDisciplina: TotalesDisciplina;
  semanas: {
    semana: string;
    km: number;
    horas: number;
    sesiones: number;
    porDisciplina: TotalesDisciplina;
  }[];
};

function resumenVacio(conectado: boolean): ResumenStrava {
  return { conectado, actividades: [], totalesPorDisciplina: totalesVacios(), semanas: [] };
}

// Trae las actividades de las últimas ~8 semanas y las agrupa por semana
// (empezando en lunes) para el resumen de volumen de entrenamiento, con
// desglose por disciplina para poder comparar con Tests/Análisis.
export async function obtenerResumenStrava(deportistaId: number): Promise<ResumenStrava> {
  const token = await tokenValido(deportistaId);
  if (!token) return resumenVacio(false);

  const ochoSemanasAtras = Math.floor(Date.now() / 1000) - 8 * 7 * 24 * 60 * 60;
  const res = await fetch(
    `${STRAVA_API}/athlete/activities?after=${ochoSemanasAtras}&per_page=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return resumenVacio(true);

  type ActividadCruda = {
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    start_date_local: string;
    total_elevation_gain: number;
    average_speed: number | null;
    average_heartrate?: number | null;
    max_heartrate?: number | null;
  };
  const crudas: ActividadCruda[] = await res.json();

  const actividades: ActividadStrava[] = crudas.map((a) => ({
    id: a.id,
    nombre: a.name,
    tipo: a.type,
    disciplina: disciplinaDeStrava(a.type),
    distancia_m: a.distance,
    tiempo_s: a.moving_time,
    fecha: a.start_date_local,
    desnivel_m: a.total_elevation_gain,
    velocidad_media_ms: a.average_speed ?? null,
    fc_media: a.average_heartrate ?? null,
    fc_max: a.max_heartrate ?? null,
  }));

  const totalesPorDisciplina = totalesVacios();
  const porSemana = new Map<
    string,
    { km: number; horas: number; sesiones: number; porDisciplina: TotalesDisciplina }
  >();
  for (const a of actividades) {
    const km = a.distancia_m / 1000;
    const horas = a.tiempo_s / 3600;

    totalesPorDisciplina[a.disciplina].km += km;
    totalesPorDisciplina[a.disciplina].horas += horas;
    totalesPorDisciplina[a.disciplina].sesiones += 1;

    const fecha = new Date(a.fecha);
    const lunes = new Date(fecha);
    const diaSemanaLunes0 = (lunes.getDay() + 6) % 7;
    lunes.setDate(lunes.getDate() - diaSemanaLunes0);
    const clave = lunes.toISOString().slice(0, 10);
    const acc = porSemana.get(clave) ?? { km: 0, horas: 0, sesiones: 0, porDisciplina: totalesVacios() };
    acc.km += km;
    acc.horas += horas;
    acc.sesiones += 1;
    acc.porDisciplina[a.disciplina].km += km;
    acc.porDisciplina[a.disciplina].horas += horas;
    acc.porDisciplina[a.disciplina].sesiones += 1;
    porSemana.set(clave, acc);
  }
  const semanas = [...porSemana.entries()]
    .map(([semana, v]) => ({ semana, ...v }))
    .sort((a, b) => (a.semana < b.semana ? 1 : -1));

  actividades.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  return {
    conectado: true,
    actividades: actividades.slice(0, 15),
    totalesPorDisciplina,
    semanas,
  };
}

// -------------------------------------------------- MÉTRICAS AVANZADAS

type ActividadDetalleCruda = {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  total_elevation_gain: number;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  average_cadence?: number | null;
  average_watts?: number | null;
  weighted_average_watts?: number | null;
  device_watts?: boolean;
};

type StreamStrava = { data: number[] };
type StreamsPorTipo = {
  time?: StreamStrava;
  distance?: StreamStrava;
  velocity_smooth?: StreamStrava;
  grade_smooth?: StreamStrava;
  heartrate?: StreamStrava;
  watts?: StreamStrava;
};

async function obtenerStreamsActividad(
  actividadId: number,
  token: string,
): Promise<PuntoStream[] | null> {
  const res = await fetch(
    `${STRAVA_API}/activities/${actividadId}/streams?keys=time,distance,velocity_smooth,grade_smooth,heartrate,watts&key_by_type=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const streams: StreamsPorTipo = await res.json();
  const tiempos = streams.time?.data;
  if (!tiempos || tiempos.length === 0) return null;

  return tiempos.map((t, i) => ({
    tiempo_s: t,
    distancia_m: streams.distance?.data[i] ?? 0,
    velocidad_ms: streams.velocity_smooth?.data[i] ?? null,
    pendiente_pct: streams.grade_smooth?.data[i] ?? null,
    fc: streams.heartrate?.data[i] ?? null,
    potencia_w: streams.watts?.data[i] ?? null,
  }));
}

export type ResultadoSincronizacion = {
  ok: boolean;
  sincronizadas: number;
  error?: string;
};

// Descarga las actividades de los últimos ~60 días, calcula las métricas
// avanzadas que se puedan calcular con lo disponible (NP/IF/VI/TSS salen
// de los campos que ya trae el resumen de Strava, sin coste extra; GAP y
// deriva de FC en carrera y ciclismo sí piden el detalle segundo a
// segundo, una petición extra por actividad) y las guarda en
// `strava_actividades`. Pensada para lanzarse solo cuando el director lo
// pide, no en cada carga de página.
export async function sincronizarActividadesStrava(deportistaId: number): Promise<ResultadoSincronizacion> {
  const token = await tokenValido(deportistaId);
  if (!token) return { ok: false, sincronizadas: 0, error: "Este deportista no tiene Strava conectado" };

  const supabase = createAdminClient();
  const { data: deportista } = await supabase
    .from("deportistas")
    .select("ftp_ciclismo_w, ftp_carrera_w")
    .eq("id", deportistaId)
    .maybeSingle();
  const ftpCiclismo = deportista?.ftp_ciclismo_w ?? null;
  const ftpCarrera = deportista?.ftp_carrera_w ?? null;

  const sesentaDiasAtras = Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60;
  const res = await fetch(
    `${STRAVA_API}/athlete/activities?after=${sesentaDiasAtras}&per_page=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return { ok: false, sincronizadas: 0, error: `Strava no respondió bien: ${await res.text()}` };
  const crudas: ActividadDetalleCruda[] = await res.json();

  let sincronizadas = 0;
  for (const a of crudas) {
    const disciplina = disciplinaDeStrava(a.type);
    const ftp = disciplina === "ciclismo" ? ftpCiclismo : disciplina === "carrera" ? ftpCarrera : null;

    const potenciaMedia = a.device_watts ? a.average_watts ?? null : null;
    const potenciaNormalizada = a.device_watts ? a.weighted_average_watts ?? null : null;
    const intensidadIF = calcularIF(potenciaNormalizada, ftp);
    const variabilidadVI = calcularVI(potenciaNormalizada, potenciaMedia);
    const tss = calcularTSS(a.moving_time, potenciaNormalizada, ftp);

    let ritmoGap: number | null = null;
    let derivaFc: number | null = null;
    // El stream (segundo a segundo) solo se pide para carrera y ciclismo,
    // que es donde tiene sentido GAP/deriva — así no se gasta cupo de
    // Strava en natación u otras actividades donde no se usa.
    if (disciplina === "carrera" || disciplina === "ciclismo") {
      try {
        const puntos = await obtenerStreamsActividad(a.id, token);
        if (puntos) {
          if (disciplina === "carrera") ritmoGap = calcularGAP(puntos);
          derivaFc = calcularDerivaFC(puntos);
        }
      } catch {
        // Si falla el stream de una actividad concreta, se sigue con las
        // demás — no se aborta toda la sincronización por una.
      }
    }

    const { error } = await supabase.from("strava_actividades").upsert({
      id: a.id,
      deportista_id: deportistaId,
      disciplina,
      nombre: a.name,
      fecha: a.start_date_local,
      distancia_m: a.distance,
      tiempo_s: a.moving_time,
      desnivel_m: a.total_elevation_gain,
      fc_media: a.average_heartrate ?? null,
      fc_max: a.max_heartrate ?? null,
      cadencia_media: a.average_cadence ?? null,
      potencia_media_w: potenciaMedia,
      potencia_normalizada_w: potenciaNormalizada,
      intensidad_if: intensidadIF,
      variabilidad_vi: variabilidadVI,
      tss,
      ritmo_gap_s_km: ritmoGap,
      deriva_fc_pct: derivaFc,
      sincronizado_en: new Date().toISOString(),
    });
    if (!error) sincronizadas += 1;
  }

  return { ok: true, sincronizadas };
}
