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
  rpeGuardado: { rpe: number; notas: string | null } | null;
};

type DeportistaConActividad = {
  deportistaId: number;
  nombre: string;
  actividades: Actividad[];
};

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

export function EntrenamientoDiarioClient({ deportistas }: { deportistas: DeportistaConActividad[] }) {
  return (
    <div>
      {deportistas.map((d) => (
        <div key={d.deportistaId} className="mb-5">
          <h3 className="font-display text-[13px] tracking-[.1em] uppercase text-signal mb-2">
            {d.nombre}
          </h3>
          {d.actividades.map((a) => (
            <ActividadCard key={a.id} deportistaId={d.deportistaId} actividad={a} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ActividadCard({ deportistaId, actividad }: { deportistaId: number; actividad: Actividad }) {
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
