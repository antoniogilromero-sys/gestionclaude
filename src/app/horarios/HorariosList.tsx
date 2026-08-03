"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { borrarHorario } from "./actions";

type Horario = {
  id: number;
  categoria: string;
  dia: string;
  disciplina: string;
  hora_inicio: string;
  hora_fin: string | null;
  lugar: string | null;
  notas: string | null;
};

const ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function capitaliza(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function HorariosList({ horarios }: { horarios: Horario[] }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onBorrar(id: number) {
    setBorrando(id);
    setError(null);
    const resultado = await borrarHorario(id);
    setBorrando(null);
    setConfirmando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  if (horarios.length === 0) {
    return (
      <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
        <b className="block text-chalk text-base mb-[5px] font-medium">
          Todavía no hay ningún horario
        </b>
        Añade el primer entrenamiento cuando quieras.
      </div>
    );
  }

  const categorias = [...new Set(horarios.map((h) => h.categoria))];

  return (
    <div>
      {error && <p className="text-run text-sm mb-3.5">{error}</p>}

      {categorias.map((cat) => {
        const deCategoria = horarios.filter((h) => h.categoria === cat);
        const diasUsados = ORDEN_DIAS.filter((d) => deCategoria.some((h) => h.dia === d));
        return (
          <div key={cat} className="mb-6">
            <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
              {cat}
            </h2>
            {diasUsados.map((dia) => (
              <div key={dia} className="mb-3.5">
                <h3 className="font-display text-[13px] tracking-[.12em] uppercase text-signal mb-2">
                  {capitaliza(dia)}
                </h3>
                {deCategoria
                  .filter((h) => h.dia === dia)
                  .map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] bg-edge text-chalk">
                            {h.disciplina}
                          </span>
                          <span className="font-display text-sm tabular-nums">
                            {h.hora_inicio.slice(0, 5)}
                            {h.hora_fin && `–${h.hora_fin.slice(0, 5)}`}
                          </span>
                        </div>
                        {h.lugar && (
                          <span className="text-xs text-mute block truncate">{h.lugar}</span>
                        )}
                        {h.notas && (
                          <span className="text-xs text-mute block truncate italic">
                            {h.notas}
                          </span>
                        )}
                      </div>
                      {confirmando === h.id ? (
                        <div className="shrink-0 flex gap-1.5">
                          <button
                            onClick={() => onBorrar(h.id)}
                            disabled={borrando === h.id}
                            className="min-h-[44px] px-3 rounded-lg border border-run text-run font-display text-xs tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                          >
                            {borrando === h.id ? "Borrando…" : "Sí, borrar"}
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
                          onClick={() => setConfirmando(h.id)}
                          className="shrink-0 min-h-[44px] px-3 rounded-lg border border-edge text-mute font-display text-xs tracking-[.06em] uppercase cursor-pointer"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
