"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearJornada } from "./actions";
import { DISCIPLINAS_JORNADA } from "./disciplinas";

type Entrenador = { id: string; nombre: string };

export function NuevaJornadaForm({ entrenadores }: { entrenadores: Entrenador[] }) {
  const router = useRouter();
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [colegio, setColegio] = useState("");
  const [contacto, setContacto] = useState("");
  const [fechaHorario, setFechaHorario] = useState("");
  const [disciplina, setDisciplina] = useState(DISCIPLINAS_JORNADA[0]);
  const [otraDisciplina, setOtraDisciplina] = useState("");
  const [entrenadorIds, setEntrenadorIds] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEntrenador(id: string) {
    setEntrenadorIds((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  }

  async function guardar() {
    setError(null);
    const anioNum = Number(anio);
    const disciplinaFinal = disciplina === "Otra" ? otraDisciplina.trim() : disciplina;

    if (!colegio.trim() || !fechaHorario.trim() || !disciplinaFinal) {
      setError("Faltan el colegio, la fecha/horario o la disciplina");
      return;
    }
    if (!(anioNum > 2000)) {
      setError("El año no es válido");
      return;
    }
    setEnviando(true);
    const resultado = await crearJornada({
      anio: anioNum,
      colegio,
      fechaHorario,
      disciplina: disciplinaFinal,
      contacto,
      entrenadorIds,
    });
    if ("error" in resultado) {
      setError(resultado.error);
      setEnviando(false);
      return;
    }
    router.push("/jornadas");
    router.refresh();
  }

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Nueva jornada / taller
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
            Año
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
          />
        </div>
        <div>
          <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
            Disciplina
          </label>
          <select
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
          >
            {DISCIPLINAS_JORNADA.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value="Otra">Otra…</option>
          </select>
        </div>
      </div>

      {disciplina === "Otra" && (
        <input
          value={otraDisciplina}
          onChange={(e) => setOtraDisciplina(e.target.value)}
          placeholder="Especifica la disciplina"
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px] mt-2.5"
        />
      )}

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Colegio
      </label>
      <input
        value={colegio}
        onChange={(e) => setColegio(e.target.value)}
        placeholder="Colegio GSD Guadarrama"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Contacto del colegio
      </label>
      <input
        value={contacto}
        onChange={(e) => setContacto(e.target.value)}
        placeholder="Carmen (opcional)"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Fecha y horario
      </label>
      <textarea
        value={fechaHorario}
        onChange={(e) => setFechaHorario(e.target.value)}
        placeholder="Mediados de septiembre, de 9 a 11h"
        className="w-full min-h-[70px] bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px] leading-relaxed"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Entrenadores asignados
      </label>
      <div className="flex flex-wrap gap-[7px]">
        {entrenadores.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => toggleEntrenador(e.id)}
            aria-pressed={entrenadorIds.includes(e.id)}
            className={`min-h-[44px] px-4 rounded-full border text-[14px] cursor-pointer ${
              entrenadorIds.includes(e.id)
                ? "bg-signal text-[#160800] border-signal font-semibold"
                : "bg-deep text-mute border-edge"
            }`}
          >
            {e.nombre}
          </button>
        ))}
        {entrenadores.length === 0 && (
          <p className="text-mute text-sm">No hay entrenadores dados de alta.</p>
        )}
      </div>

      {error && <p className="text-run text-sm mt-3">{error}</p>}

      <button
        onClick={guardar}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer mt-4 disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar jornada"}
      </button>
    </div>
  );
}
