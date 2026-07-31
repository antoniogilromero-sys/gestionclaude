"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toISODateLocal } from "@/lib/date";
import { publicarSesion } from "./actions";

const DISCIPLINAS = [
  { value: "natacion", label: "Natación" },
  { value: "ciclismo", label: "Ciclismo" },
  { value: "carrera", label: "Carrera" },
  { value: "combinado", label: "Combinado" },
  { value: "fuerza", label: "Fuerza" },
];

export function PublicarForm({ grupos }: { grupos: { id: number; nombre: string }[] }) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(() => toISODateLocal(new Date()));
  const [disciplina, setDisciplina] = useState("natacion");
  const [contenido, setContenido] = useState("");
  const [material, setMaterial] = useState("");
  const [grupoIds, setGrupoIds] = useState<number[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGrupo(id: number) {
    setGrupoIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function publicar() {
    setError(null);
    if (!titulo.trim() || !contenido.trim() || grupoIds.length === 0) {
      setError("Faltan título, contenido o grupos");
      return;
    }
    setEnviando(true);
    const resultado = await publicarSesion({ titulo, fecha, disciplina, contenido, material, grupoIds });
    if ("error" in resultado) {
      setError(resultado.error);
      setEnviando(false);
    } else {
      router.push("/entrenamientos");
      router.refresh();
    }
  }

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Publicar entrenamiento
      </h2>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Título
      </label>
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Series umbral + técnica de viraje"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
            Fecha
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
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
            {DISCIPLINAS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Grupos que lo hacen
      </label>
      <div className="flex flex-wrap gap-[7px]">
        {grupos.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => toggleGrupo(g.id)}
            aria-pressed={grupoIds.includes(g.id)}
            className={`min-h-[44px] px-4 rounded-full border text-[14px] cursor-pointer ${
              grupoIds.includes(g.id)
                ? "bg-signal text-[#160800] border-signal font-semibold"
                : "bg-deep text-mute border-edge"
            }`}
          >
            {g.nombre}
          </button>
        ))}
      </div>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Contenido de la sesión
      </label>
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder={"CALENTAMIENTO\n400 progresivos...\n\nPRINCIPAL\n8 x 100 salida cada 2'00"}
        className="w-full min-h-[120px] bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px] leading-relaxed"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Material necesario
      </label>
      <input
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        placeholder="Pull buoy, aletas, cronómetro"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      {error && <p className="text-run text-sm mt-3">{error}</p>}

      <button
        onClick={publicar}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer mt-4 disabled:opacity-60"
      >
        {enviando ? "Publicando…" : "Publicar a los grupos"}
      </button>
      <p className="text-xs text-mute leading-relaxed mt-3.5 pt-3 border-t border-edge">
        Los entrenadores de los grupos marcados lo verán al entrar. Podrás
        saber quién lo ha abierto.
      </p>
    </div>
  );
}
