"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearHorario } from "./actions";

const DIAS = [
  { value: "lunes", label: "Lunes" },
  { value: "martes", label: "Martes" },
  { value: "miercoles", label: "Miércoles" },
  { value: "jueves", label: "Jueves" },
  { value: "viernes", label: "Viernes" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export function NuevoHorarioForm() {
  const router = useRouter();
  const [categoria, setCategoria] = useState("");
  const [dia, setDia] = useState(DIAS[0].value);
  const [disciplina, setDisciplina] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [lugar, setLugar] = useState("");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    if (!categoria.trim()) {
      setError("Falta la categoría");
      return;
    }
    if (!disciplina.trim()) {
      setError("Falta la disciplina");
      return;
    }
    if (!horaInicio) {
      setError("Falta la hora de inicio");
      return;
    }
    setEnviando(true);
    const resultado = await crearHorario({
      categoria,
      dia,
      disciplina,
      horaInicio,
      horaFin,
      lugar,
      notas,
    });
    if ("error" in resultado) {
      setError(resultado.error);
      setEnviando(false);
      return;
    }
    router.push("/horarios");
    router.refresh();
  }

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Nuevo horario
      </h2>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Categoría
      </label>
      <input
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        placeholder="Adultos, Escuela…"
        list="categorias-horario"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />
      <datalist id="categorias-horario">
        <option value="Adultos" />
        <option value="Escuela" />
      </datalist>

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

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Disciplina
      </label>
      <input
        value={disciplina}
        onChange={(e) => setDisciplina(e.target.value)}
        placeholder="Atletismo, Natación, MTB, Ciclismo…"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

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
        Lugar (opcional)
      </label>
      <input
        value={lugar}
        onChange={(e) => setLugar(e.target.value)}
        placeholder="Dehesa de Alpedrete"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Notas (opcional)
      </label>
      <input
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        placeholder="A partir de infantil"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      {error && <p className="text-run text-sm mt-3">{error}</p>}

      <button
        onClick={guardar}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer mt-4 disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar horario"}
      </button>
    </div>
  );
}
