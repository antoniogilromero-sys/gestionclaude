"use client";

import { useState } from "react";
import { Competiciones } from "./Competiciones";
import { ProximasCompeticiones } from "./ProximasCompeticiones";

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
type Proxima = {
  id: number;
  nombre: string;
  fecha: string | null;
  lugar: string | null;
  disciplina: string;
  notas: string | null;
};

export function CompeticionesTabs({
  deportistas,
  competiciones,
  proximas,
  soloLectura,
}: {
  deportistas: Deportista[];
  competiciones: Competicion[];
  proximas: Proxima[];
  soloLectura: boolean;
}) {
  const [tab, setTab] = useState<"proximas" | "resultados">("proximas");

  return (
    <div>
      <div className="flex bg-surf border border-edge rounded-[9px] p-1 mb-4">
        {(["proximas", "resultados"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg font-display text-xs tracking-[.08em] uppercase cursor-pointer ${
              tab === t ? "bg-signal text-[#160800] font-semibold" : "text-mute"
            }`}
          >
            {t === "proximas" ? "Próximas" : "Resultados"}
          </button>
        ))}
      </div>

      {tab === "proximas" && <ProximasCompeticiones proximas={proximas} soloLectura={soloLectura} />}
      {tab === "resultados" && (
        <Competiciones deportistas={deportistas} competiciones={competiciones} soloLectura={soloLectura} />
      )}
    </div>
  );
}
