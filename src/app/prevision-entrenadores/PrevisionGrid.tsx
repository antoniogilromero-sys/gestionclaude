"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { borrarPrevision } from "./actions";

type Fila = {
  id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string | null;
  entrenador: string;
  grupo: string | null;
  disciplina: string;
  orden: number;
};

const ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const ABREV_DIAS: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

// Mismos colores que la leyenda del Excel de Antón.
const COLOR_DISCIPLINA: Record<string, string> = {
  natacion: "#43C6E0",
  carrera: "#FF6EC7",
  mtb: "#D2691E",
  carretera: "#8FCB4F",
  fuerza: "#E0A93D",
};
const DISCIPLINA_LABEL: Record<string, string> = {
  natacion: "Natación",
  carrera: "Atletismo",
  mtb: "MTB",
  carretera: "Carretera",
  fuerza: "Fuerza",
};

function franja(hIni: string, hFin: string | null) {
  return `${hIni.slice(0, 5)}${hFin ? `-${hFin.slice(0, 5)}` : ""}`;
}

export function PrevisionGrid({ filas }: { filas: Fila[] }) {
  const router = useRouter();
  const [borrandoId, setBorrandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const diasUsados = useMemo(
    () => ORDEN_DIAS.filter((d) => filas.some((f) => f.dia === d)),
    [filas],
  );
  const franjas = useMemo(() => {
    const set = new Set(filas.map((f) => franja(f.hora_inicio, f.hora_fin)));
    return [...set].sort();
  }, [filas]);

  async function onBorrar(id: number) {
    setBorrandoId(id);
    setError(null);
    const resultado = await borrarPrevision(id);
    setBorrandoId(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  if (filas.length === 0) {
    return (
      <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
        <b className="block text-chalk text-base mb-[5px] font-medium">
          Todavía no hay nada en la previsión
        </b>
        Añade la primera franja cuando quieras.
      </div>
    );
  }

  return (
    <div>
      {error && <p className="text-run text-sm mb-3.5">{error}</p>}

      <div className="overflow-x-auto mb-5">
        <table className="border-collapse text-[13px] w-full">
          <thead>
            <tr>
              <th className="text-left font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2 sticky left-0 bg-deep">
                Hora
              </th>
              {diasUsados.map((d) => (
                <th
                  key={d}
                  className="text-left font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2 min-w-[130px]"
                >
                  {ABREV_DIAS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {franjas.map((fr) => (
              <tr key={fr}>
                <td className="font-display text-xs tabular-nums text-mute py-2 px-2 border-b border-edge/50 sticky left-0 bg-deep whitespace-nowrap">
                  {fr}
                </td>
                {diasUsados.map((d) => {
                  const celda = filas.filter(
                    (f) => f.dia === d && franja(f.hora_inicio, f.hora_fin) === fr,
                  );
                  return (
                    <td key={d} className="align-top py-2 px-2 border-b border-edge/50">
                      <div className="flex flex-col gap-1">
                        {celda.map((f) => (
                          <div
                            key={f.id}
                            className="rounded-[6px] px-2 py-1 flex items-center justify-between gap-1.5"
                            style={{ backgroundColor: `${COLOR_DISCIPLINA[f.disciplina]}30` }}
                          >
                            <span className="min-w-0">
                              <b
                                className="block text-[12px] font-semibold truncate"
                                style={{ color: COLOR_DISCIPLINA[f.disciplina] }}
                              >
                                {f.entrenador}
                              </b>
                              {f.grupo && (
                                <span className="block text-[11px] text-mute truncate">
                                  {f.grupo}
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => onBorrar(f.id)}
                              disabled={borrandoId === f.id}
                              aria-label={`Borrar ${f.entrenador}`}
                              className="shrink-0 text-mute text-xs disabled:opacity-40 cursor-pointer"
                            >
                              {borrandoId === f.id ? "…" : "✕"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(DISCIPLINA_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-mute">
            <span
              className="w-3 h-3 rounded-[3px] inline-block"
              style={{ backgroundColor: COLOR_DISCIPLINA[key] }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
