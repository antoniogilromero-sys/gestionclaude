"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearPrevision } from "../actions";

const DIAS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

const DISCIPLINAS = [
  { value: "natacion", label: "Natación", color: "#43C6E0" },
  { value: "carrera", label: "Atletismo", color: "#FF6EC7" },
  { value: "mtb", label: "MTB", color: "#D2691E" },
  { value: "carretera", label: "Carretera", color: "#8FCB4F" },
  { value: "fuerza", label: "Fuerza", color: "#E0A93D" },
];

export function NuevaPrevisionForm() {
  const router = useRouter();
  const [dia, setDia] = useState(DIAS[0].value);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [entrenador, setEntrenador] = useState("");
  const [grupo, setGrupo] = useState("");
  const [disciplina, setDisciplina] = useState(DISCIPLINAS[0].value);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(seguir: boolean) {
    setError(null);
    if (!entrenador.trim()) {
      setError("Falta el entrenador");
      return;
    }
    if (!horaInicio) {
      setError("Falta la hora de inicio");
      return;
    }
    setEnviando(true);
    const resultado = await crearPrevision({
      dia,
      horaInicio,
      horaFin,
      entrenador,
      grupo,
      disciplina,
    });
    setEnviando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    if (seguir) {
      // Deja el día/hora/disciplina puestos: lo normal es meter varios
      // entrenadores seguidos en la misma franja (como en el Excel).
      setEntrenador("");
      setGrupo("");
      router.refresh();
    } else {
      router.push("/prevision-entrenadores");
      router.refresh();
    }
  }

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Nueva franja de previsión
      </h2>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Día
      </label>
      <select
        value={dia}
        onChange={(e) => setDia(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      >
        {DIAS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
            Hora inicio
          </label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
          />
        </div>
        <div>
          <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
            Hora fin (opcional)
          </label>
          <input
            type="time"
            value={horaFin}
            onChange={(e) => setHoraFin(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
          />
        </div>
      </div>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Entrenador
      </label>
      <input
        value={entrenador}
        onChange={(e) => setEntrenador(e.target.value)}
        placeholder="Celia, Toni, Rotativo…"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Grupo (opcional)
      </label>
      <input
        value={grupo}
        onChange={(e) => setGrupo(e.target.value)}
        placeholder="Adultos, Peques, Medio-Avanzado…"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Disciplina
      </label>
      <div className="flex flex-wrap gap-1.5">
        {DISCIPLINAS.map((d) => {
          const on = disciplina === d.value;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => setDisciplina(d.value)}
              aria-pressed={on}
              style={
                on
                  ? { backgroundColor: d.color, borderColor: d.color, color: "#160800" }
                  : { borderColor: d.color, color: d.color }
              }
              className="px-3 py-1.5 rounded-full border font-display text-xs tracking-[.04em] cursor-pointer font-semibold"
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {error && <p className="text-run text-sm mt-3">{error}</p>}

      <button
        onClick={() => guardar(true)}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer mt-4 disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar y añadir otro"}
      </button>
      <button
        onClick={() => guardar(false)}
        disabled={enviando}
        className="w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-sm tracking-[.06em] uppercase cursor-pointer mt-2 disabled:opacity-60"
      >
        Guardar y terminar
      </button>
    </div>
  );
}
