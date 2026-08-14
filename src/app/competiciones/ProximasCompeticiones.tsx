"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearProximaCompeticion, borrarProximaCompeticion } from "./actions";

type Proxima = {
  id: number;
  nombre: string;
  fecha: string | null;
  lugar: string | null;
  disciplina: string;
  notas: string | null;
  es_escolar: boolean;
};

// Más amplio que en Resultados (Competiciones.tsx): el calendario de
// próximas también recoge carreras sueltas de running/natación a las que
// va gente del club, no solo triatlón/duatlón/acuatlón.
const DISCIPLINAS = ["Triatlón", "Duatlón", "Acuatlón", "Natación", "Carrera", "SwimRun", "Otro"];

function fechaPasada(fecha: string | null) {
  if (!fecha) return false;
  return fecha < new Date().toISOString().slice(0, 10);
}

export function ProximasCompeticiones({
  proximas,
  soloLectura = false,
}: {
  proximas: Proxima[];
  soloLectura?: boolean;
}) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);

  // Las que ya han pasado (sin borrar todavía) se muestran aparte, al
  // final, para no mezclar "lo que viene" con "lo que ya se corrió".
  const vienen = proximas.filter((p) => !fechaPasada(p.fecha));
  const pasadas = proximas.filter((p) => fechaPasada(p.fecha));

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-display text-[13px] tracking-[.1em] uppercase text-mute">
          Próximas competiciones
        </h3>
        {!soloLectura && (
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="font-display text-xs tracking-[.08em] uppercase text-signal cursor-pointer"
          >
            {mostrarForm ? "Cancelar" : "+ Nueva"}
          </button>
        )}
      </div>

      {!soloLectura && mostrarForm && (
        <NuevaProximaForm
          onGuardado={() => {
            setMostrarForm(false);
            router.refresh();
          }}
        />
      )}

      {proximas.length === 0 ? (
        <p className="text-mute text-sm text-center py-6">
          Todavía no hay ninguna carrera apuntada en el calendario.
        </p>
      ) : (
        <>
          {vienen.length === 0 ? (
            <p className="text-mute text-sm text-center py-4">
              No hay carreras pendientes por ahora.
            </p>
          ) : (
            vienen.map((p) => (
              <FilaProxima key={p.id} p={p} soloLectura={soloLectura} onBorrado={() => router.refresh()} />
            ))
          )}

          {pasadas.length > 0 && (
            <details className="mt-4">
              <summary className="font-display text-[12px] tracking-[.1em] uppercase text-mute cursor-pointer">
                Ya pasadas ({pasadas.length})
              </summary>
              <div className="mt-2.5 opacity-60">
                {pasadas.map((p) => (
                  <FilaProxima key={p.id} p={p} soloLectura={soloLectura} onBorrado={() => router.refresh()} />
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function FilaProxima({
  p,
  soloLectura,
  onBorrado,
}: {
  p: Proxima;
  soloLectura: boolean;
  onBorrado: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBorrar() {
    setBorrando(true);
    setError(null);
    const resultado = await borrarProximaCompeticion(p.id);
    setBorrando(false);
    if ("error" in resultado) setError(resultado.error);
    else onBorrado();
  }

  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] ${
                p.es_escolar ? "bg-swim/20 text-swim" : "bg-edge text-chalk"
              }`}
            >
              {p.disciplina}
            </span>
            {p.es_escolar && (
              <span className="font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] bg-swim/20 text-swim">
                Escolar
              </span>
            )}
            {p.fecha ? (
              <span className="text-xs text-mute">{p.fecha.split("-").reverse().join("/")}</span>
            ) : (
              <span className="text-xs text-mute italic">fecha por confirmar</span>
            )}
          </div>
          <b className="block text-[15px] font-medium truncate">{p.nombre}</b>
          {p.lugar && <span className="text-xs text-mute block">{p.lugar}</span>}
          {p.notas && <span className="text-xs text-mute block mt-1">{p.notas}</span>}
          {error && <p className="text-run text-xs mt-1">{error}</p>}
        </div>
        {!soloLectura &&
          (confirmando ? (
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
          ))}
      </div>
    </div>
  );
}

function NuevaProximaForm({ onGuardado }: { onGuardado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [disciplina, setDisciplina] = useState(DISCIPLINAS[0]);
  const [notas, setNotas] = useState("");
  const [esEscolar, setEsEscolar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    if (!nombre.trim()) {
      setError("Falta el nombre de la carrera");
      return;
    }
    setEnviando(true);
    const resultado = await crearProximaCompeticion({ nombre, fecha, lugar, disciplina, notas, esEscolar });
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
        Nombre de la carrera
      </label>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Triatlón de Guadarrama"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5"
      />

      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <div>
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Fecha (opcional)
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
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
        Lugar (opcional)
      </label>
      <input
        value={lugar}
        onChange={(e) => setLugar(e.target.value)}
        placeholder="Guadarrama"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5"
      />

      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
        Notas (opcional)
      </label>
      <input
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="Inscripción hasta el 3 de octubre"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-3"
      />

      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={esEscolar}
          onChange={(e) => setEsEscolar(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm text-chalk">Es del Circuito Escolar (se pinta en azul claro)</span>
      </label>

      {error && <p className="text-run text-sm mb-2">{error}</p>}

      <button
        onClick={guardar}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}
