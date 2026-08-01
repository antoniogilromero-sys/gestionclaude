"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { borrarJornada } from "./actions";

type Jornada = {
  id: number;
  colegio: string;
  fechaHorario: string;
  disciplina: string;
  contacto: string | null;
  entrenadores: string[];
};

export function CuadranteAnio({ anio, jornadas }: { anio: number; jornadas: Jornada[] }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onBorrar(id: number) {
    setBorrando(id);
    setError(null);
    const resultado = await borrarJornada(id);
    setBorrando(null);
    setConfirmando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  return (
    <div className="mb-5">
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Cuadrante {anio}
      </h2>

      {error && <p className="text-run text-sm mb-3">{error}</p>}

      {jornadas.length === 0 ? (
        <p className="text-mute text-sm">Todavía no hay ninguna jornada este año.</p>
      ) : (
        <div className="overflow-x-auto -mx-[18px] px-[18px]">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-edge">
                <th className="text-left py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                  Colegio
                </th>
                <th className="text-left py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                  Fecha / horario
                </th>
                <th className="text-left py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                  Disciplina
                </th>
                <th className="text-left py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                  Contacto
                </th>
                <th className="text-left py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                  Entrenadores
                </th>
                <th className="text-right py-2 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody>
              {jornadas.map((j) => (
                <tr key={j.id} className="border-b border-edge/60 align-top">
                  <td className="py-2.5 pr-3 font-medium">{j.colegio}</td>
                  <td className="py-2.5 pr-3 text-mute">{j.fechaHorario}</td>
                  <td className="py-2.5 pr-3">
                    <span className="font-display text-xs tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px] bg-edge text-chalk">
                      {j.disciplina}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-mute">{j.contacto ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-mute">
                    {j.entrenadores.length > 0 ? j.entrenadores.join(" y ") : "—"}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    {confirmando === j.id ? (
                      <span className="inline-flex gap-1.5">
                        <button
                          onClick={() => onBorrar(j.id)}
                          disabled={borrando === j.id}
                          className="min-h-[36px] px-2.5 rounded-lg border border-run text-run font-display text-[11px] tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                        >
                          {borrando === j.id ? "…" : "Sí"}
                        </button>
                        <button
                          onClick={() => setConfirmando(null)}
                          className="min-h-[36px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmando(j.id)}
                        className="min-h-[36px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
                      >
                        Borrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
