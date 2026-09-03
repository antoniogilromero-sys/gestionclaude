"use client";

import { useState } from "react";
import { guardarRpe } from "./actions";

type Disciplina = "natacion" | "ciclismo" | "carrera" | "otro";

type Actividad = {
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
  potencia_media_w: number | null;
  potencia_max_w: number | null;
};

type ActividadConRpe = Actividad & { rpeGuardado: { rpe: number; notas: string | null } | null };

type Deportista = { deportistaId: number; nombre: string };
type RpeGuardado = { rpe: number; notas: string | null };

const COLOR_DISC: Record<Disciplina, string> = {
  natacion: "#43C6E0",
  ciclismo: "#A8D84A",
  carrera: "#FF9145",
  otro: "#7FA5B0",
};
const NOMBRE_DISC: Record<Disciplina, string> = {
  natacion: "Natación",
  ciclismo: "Ciclismo",
  carrera: "Carrera",
  otro: "Otro",
};

function fmtFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function fmtMinSeg(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ritmoOVelocidad(a: Actividad): string | null {
  if (a.tiempo_s <= 0 || a.distancia_m <= 0) return null;
  if (a.disciplina === "carrera") return `${fmtMinSeg(a.tiempo_s / (a.distancia_m / 1000))} /km`;
  if (a.disciplina === "natacion") return `${fmtMinSeg(a.tiempo_s / (a.distancia_m / 100))} /100m`;
  if (a.velocidad_media_ms != null) return `${(a.velocidad_media_ms * 3.6).toFixed(1)} km/h`;
  return null;
}

// Un solo botón de recarga a mano dentro de cada persona, además de la
// carga automática al desplegar — por si se anota un entreno nuevo
// mientras la tienes abierta.
type Estado = "sin_cargar" | "cargando" | "ok" | "error";

export function EntrenamientoDiarioClient({
  deportistas,
  rpes,
}: {
  deportistas: Deportista[];
  rpes: Record<number, RpeGuardado>;
}) {
  const [abiertoId, setAbiertoId] = useState<number | null>(null);
  const [estados, setEstados] = useState<Record<number, Estado>>({});
  const [actividadesPorDeportista, setActividadesPorDeportista] = useState<
    Record<number, ActividadConRpe[]>
  >({});

  async function cargar(deportistaId: number) {
    setEstados((s) => ({ ...s, [deportistaId]: "cargando" }));
    try {
      const res = await fetch(`/api/strava/resumen?deportistaId=${deportistaId}`);
      const data = await res.json();
      if (!res.ok || !("actividades" in data)) throw new Error(data?.error ?? "Fallo al pedir Strava");

      const haceUnaSemana = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const actividades: ActividadConRpe[] = (data.actividades as Actividad[])
        .filter((a) => new Date(a.fecha).getTime() >= haceUnaSemana)
        .map((a) => ({ ...a, rpeGuardado: rpes[a.id] ?? null }));

      setActividadesPorDeportista((s) => ({ ...s, [deportistaId]: actividades }));
      setEstados((s) => ({ ...s, [deportistaId]: "ok" }));
    } catch {
      setEstados((s) => ({ ...s, [deportistaId]: "error" }));
    }
  }

  function onClickDeportista(deportistaId: number) {
    const abrir = abiertoId !== deportistaId;
    setAbiertoId(abrir ? deportistaId : null);
    // Pide siempre datos frescos al abrir — no se queda con lo que
    // hubiera cargado la última vez que se abrió esta persona.
    if (abrir) cargar(deportistaId);
  }

  return (
    <div>
      {deportistas.map((d) => {
        const abierto = abiertoId === d.deportistaId;
        const estado = estados[d.deportistaId] ?? "sin_cargar";
        const actividades = actividadesPorDeportista[d.deportistaId] ?? [];
        return (
          <div key={d.deportistaId} className="mb-2.5">
            <button
              onClick={() => onClickDeportista(d.deportistaId)}
              aria-expanded={abierto}
              className="w-full flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] px-3.5 py-3.5 text-left cursor-pointer min-h-[44px]"
            >
              <span className="text-[15px] font-medium">{d.nombre}</span>
              <span className="text-mute text-xs shrink-0">{abierto ? "▲" : "▼"}</span>
            </button>

            {abierto && (
              <div className="mt-2.5">
                {estado === "cargando" && (
                  <p className="text-mute text-xs text-center py-5">Pidiendo datos a Strava…</p>
                )}
                {estado === "error" && (
                  <div className="text-center py-5">
                    <p className="text-run text-xs mb-2">No se ha podido cargar Strava.</p>
                    <button
                      onClick={() => cargar(d.deportistaId)}
                      className="text-signal text-xs underline cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
                {estado === "ok" && actividades.length === 0 && (
                  <p className="text-mute text-xs text-center py-5">
                    Sin actividad en los últimos 7 días.
                  </p>
                )}
                {estado === "ok" &&
                  actividades.map((a) => (
                    <ActividadCard key={a.id} deportistaId={d.deportistaId} actividad={a} />
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ActividadCard({ deportistaId, actividad }: { deportistaId: number; actividad: ActividadConRpe }) {
  const [editando, setEditando] = useState(false);
  const [rpe, setRpe] = useState(actividad.rpeGuardado?.rpe ?? 0);
  const [notas, setNotas] = useState(actividad.rpeGuardado?.notas ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(actividad.rpeGuardado);

  const ritmo = ritmoOVelocidad(actividad);

  async function guardar() {
    if (!rpe) {
      setError("Elige un RPE del 1 al 10");
      return;
    }
    setGuardando(true);
    setError(null);
    const resultado = await guardarRpe({
      stravaActividadId: actividad.id,
      deportistaId,
      rpe,
      notas,
    });
    setGuardando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setGuardado({ rpe, notas: notas || null });
    setEditando(false);
  }

  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5">
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span
          className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px]"
          style={{ backgroundColor: `${COLOR_DISC[actividad.disciplina]}25`, color: COLOR_DISC[actividad.disciplina] }}
        >
          {NOMBRE_DISC[actividad.disciplina]}
        </span>
        <span className="text-xs text-mute capitalize">{fmtFecha(actividad.fecha)}</span>
        <b className="text-sm ml-1">{actividad.nombre}</b>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-[13px]">
        <Dato label="Distancia" valor={`${(actividad.distancia_m / 1000).toFixed(1)} km`} />
        <Dato label="Tiempo" valor={fmtMinSeg(actividad.tiempo_s)} />
        {ritmo && <Dato label={actividad.disciplina === "ciclismo" ? "Velocidad" : "Ritmo"} valor={ritmo} />}
        <Dato label="Desnivel" valor={`${Math.round(actividad.desnivel_m)} m`} />
        <Dato label="FC media" valor={actividad.fc_media != null ? `${Math.round(actividad.fc_media)} ppm` : "—"} />
        <Dato label="FC máxima" valor={actividad.fc_max != null ? `${Math.round(actividad.fc_max)} ppm` : "—"} />
        {actividad.potencia_media_w != null && (
          <Dato label="Vatios medio" valor={`${Math.round(actividad.potencia_media_w)} W`} />
        )}
        {actividad.potencia_max_w != null && (
          <Dato label="Vatios máx." valor={`${Math.round(actividad.potencia_max_w)} W`} />
        )}
      </div>

      {editando ? (
        <div className="bg-deep border border-edge rounded-lg p-2.5">
          <span className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1.5">
            Percepción del esfuerzo (RPE)
          </span>
          <div className="flex flex-wrap gap-1 mb-2.5">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRpe(n)}
                aria-pressed={rpe === n}
                className={`min-w-[32px] min-h-[32px] rounded-full border font-display text-xs cursor-pointer ${
                  rpe === n
                    ? "bg-signal text-[#160800] border-signal font-semibold"
                    : "bg-surf text-mute border-edge"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Nota (opcional)"
            className="w-full bg-surf border border-edge text-chalk rounded-lg px-2.5 py-1.5 text-sm mb-2.5"
          />
          {error && <p className="text-run text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={guardar}
              disabled={guardando}
              className="bg-signal text-[#160800] rounded-lg px-3 py-1.5 font-display text-xs uppercase font-semibold cursor-pointer disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button
              onClick={() => setEditando(false)}
              className="text-mute text-xs underline"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : guardado ? (
        <button
          onClick={() => setEditando(true)}
          className="w-full text-left bg-deep border border-edge rounded-lg px-2.5 py-2 cursor-pointer"
        >
          <span className="font-display text-xs tracking-[.06em] uppercase text-signal">
            RPE {guardado.rpe}/10
          </span>
          {guardado.notas && <span className="text-xs text-mute"> · {guardado.notas}</span>}
          <span className="text-mute text-xs underline ml-1.5">editar</span>
        </button>
      ) : (
        <button
          onClick={() => setEditando(true)}
          className="w-full bg-transparent border border-edge text-mute rounded-lg py-2 font-display text-xs tracking-[.06em] uppercase cursor-pointer"
        >
          + Añadir percepción del esfuerzo
        </button>
      )}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <span className="text-mute text-[10px] uppercase tracking-[.04em] block">{label}</span>
      <span className="text-chalk font-medium">{valor}</span>
    </div>
  );
}
