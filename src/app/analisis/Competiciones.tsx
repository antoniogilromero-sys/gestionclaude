"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearCompeticion, borrarCompeticion } from "./actions";

type Deportista = { id: number; nombre: string };
type Competicion = {
  id: number;
  deportista_id: number;
  anio: number;
  nombre_carrera: string;
  fecha: string | null;
  disciplina: string;
  tiempo: string | null;
  clasificacion: string | null;
  deportistaNombre: string;
};

const DISCIPLINAS = ["Duatlón", "Triatlón", "Acuatlón"];

export function Competiciones({
  deportistas,
  competiciones,
}: {
  deportistas: Deportista[];
  competiciones: Competicion[];
}) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);

  const anios = [...new Set(competiciones.map((c) => c.anio))].sort((a, b) => b - a);

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-display text-[13px] tracking-[.1em] uppercase text-mute">
          Resultados de competiciones
        </h3>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="font-display text-xs tracking-[.08em] uppercase text-signal cursor-pointer"
        >
          {mostrarForm ? "Cancelar" : "+ Nueva"}
        </button>
      </div>

      {mostrarForm && (
        <NuevaCompeticionForm
          deportistas={deportistas}
          onGuardado={() => {
            setMostrarForm(false);
            router.refresh();
          }}
        />
      )}

      {competiciones.length === 0 ? (
        <p className="text-mute text-sm text-center py-6">
          Todavía no hay ningún resultado de competición registrado.
        </p>
      ) : (
        anios.map((anio) => (
          <div key={anio} className="mb-5">
            <h4 className="font-display text-[13px] tracking-[.12em] uppercase text-signal mb-2">
              {anio}
            </h4>
            {competiciones
              .filter((c) => c.anio === anio)
              .map((c) => (
                <FilaCompeticion key={c.id} c={c} onBorrado={() => router.refresh()} />
              ))}
          </div>
        ))
      )}
    </div>
  );
}

function FilaCompeticion({ c, onBorrado }: { c: Competicion; onBorrado: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBorrar() {
    setBorrando(true);
    setError(null);
    const resultado = await borrarCompeticion(c.id);
    setBorrando(false);
    if ("error" in resultado) setError(resultado.error);
    else onBorrado();
  }

  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] bg-edge text-chalk">
              {c.disciplina}
            </span>
            {c.fecha && (
              <span className="text-xs text-mute">
                {c.fecha.split("-").reverse().join("/")}
              </span>
            )}
          </div>
          <b className="block text-[15px] font-medium truncate">{c.nombre_carrera}</b>
          <span className="text-xs text-mute block">{c.deportistaNombre}</span>
          {(c.tiempo || c.clasificacion) && (
            <span className="text-xs text-mute block mt-1">
              {c.tiempo && `Tiempo: ${c.tiempo}`}
              {c.tiempo && c.clasificacion && " · "}
              {c.clasificacion && `Clasificación: ${c.clasificacion}`}
            </span>
          )}
          {error && <p className="text-run text-xs mt-1">{error}</p>}
        </div>
        {confirmando ? (
          <div className="shrink-0 flex gap-1.5">
            <button
              onClick={onBorrar}
              disabled={borrando}
              className="min-h-[40px] px-2.5 rounded-lg border border-run text-run font-display text-[11px] tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
            >
              {borrando ? "…" : "Sí"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="min-h-[40px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="shrink-0 min-h-[40px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
          >
            Borrar
          </button>
        )}
      </div>
    </div>
  );
}

function NuevaCompeticionForm({
  deportistas,
  onGuardado,
}: {
  deportistas: Deportista[];
  onGuardado: () => void;
}) {
  const [deportistaId, setDeportistaId] = useState(deportistas[0]?.id ?? 0);
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [nombreCarrera, setNombreCarrera] = useState("");
  const [fecha, setFecha] = useState("");
  const [disciplina, setDisciplina] = useState(DISCIPLINAS[0]);
  const [tiempo, setTiempo] = useState("");
  const [clasificacion, setClasificacion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    const anioNum = Number(anio);
    if (!deportistaId) {
      setError("Elige un deportista");
      return;
    }
    if (!nombreCarrera.trim()) {
      setError("Falta el nombre de la carrera");
      return;
    }
    if (!(anioNum > 2000)) {
      setError("El año no es válido");
      return;
    }
    setEnviando(true);
    const resultado = await crearCompeticion({
      deportistaId,
      anio: anioNum,
      nombreCarrera,
      fecha,
      disciplina,
      tiempo,
      clasificacion,
    });
    setEnviando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    onGuardado();
  }

  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-4">
      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
        Deportista
      </label>
      <select
        value={deportistaId}
        onChange={(e) => setDeportistaId(Number(e.target.value))}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5"
      >
        {deportistas.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nombre}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <div>
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Año
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Disciplina
          </label>
          <select
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
          >
            {DISCIPLINAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
        Nombre de la carrera
      </label>
      <input
        value={nombreCarrera}
        onChange={(e) => setNombreCarrera(e.target.value)}
        placeholder="Triatlón de Guadarrama"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5"
      />

      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
        Fecha (opcional)
      </label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5"
      />

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div>
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Tiempo
          </label>
          <input
            value={tiempo}
            onChange={(e) => setTiempo(e.target.value)}
            placeholder="1:45:32"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
          />
        </div>
        <div>
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Clasificación
          </label>
          <input
            value={clasificacion}
            onChange={(e) => setClasificacion(e.target.value)}
            placeholder="3º general, 1º cat."
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-run text-sm mb-2">{error}</p>}

      <button
        onClick={guardar}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar resultado"}
      </button>
    </div>
  );
}
