"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { borrarJornada } from "./actions";

type Jornada = {
  id: number;
  anio: number;
  colegio: string;
  fechaHorario: string;
  disciplina: string;
  contacto: string | null;
  entrenadores: string[];
};

export function JornadasList({ jornadas }: { jornadas: Jornada[] }) {
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

  if (jornadas.length === 0) {
    return (
      <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
        <b className="block text-chalk text-base mb-[5px] font-medium">
          Todavía no hay ninguna
        </b>
        Añade la primera jornada o taller de promoción cuando quieras.
      </div>
    );
  }

  const anios = [...new Set(jornadas.map((j) => j.anio))].sort((a, b) => b - a);

  return (
    <div>
      {error && <p className="text-run text-sm mb-3.5">{error}</p>}

      {anios.map((anio) => (
        <div key={anio} className="mb-5">
          <h3 className="font-display text-[13px] tracking-[.12em] uppercase text-signal mb-2">
            Año {anio}
          </h3>
          {jornadas
            .filter((j) => j.anio === anio)
            .map((j) => (
              <div
                key={j.id}
                className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] bg-edge text-chalk">
                        {j.disciplina}
                      </span>
                    </div>
                    <b className="block text-[15px] font-medium truncate">{j.colegio}</b>
                    <span className="text-xs text-mute block mt-0.5">{j.fechaHorario}</span>
                    {j.contacto && (
                      <span className="text-xs text-mute block mt-0.5">
                        Contacto: {j.contacto}
                      </span>
                    )}
                    <span className="text-xs text-mute block mt-1">
                      {j.entrenadores.length > 0
                        ? j.entrenadores.join(" y ")
                        : "Sin entrenadores asignados"}
                    </span>
                  </div>
                  {confirmando === j.id ? (
                    <div className="shrink-0 flex flex-col gap-1.5">
                      <button
                        onClick={() => onBorrar(j.id)}
                        disabled={borrando === j.id}
                        className="min-h-[44px] px-3 rounded-lg border border-run text-run font-display text-xs tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                      >
                        {borrando === j.id ? "Borrando…" : "Sí, borrar"}
                      </button>
                      <button
                        onClick={() => setConfirmando(null)}
                        className="min-h-[44px] px-3 rounded-lg border border-edge text-mute font-display text-xs tracking-[.06em] uppercase cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmando(j.id)}
                      className="shrink-0 min-h-[44px] px-3 rounded-lg border border-edge text-mute font-display text-xs tracking-[.06em] uppercase cursor-pointer"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
