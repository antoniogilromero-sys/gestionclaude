"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  tarifaDe,
  horasSemanales,
  DISCIPLINA_LABEL,
  type Grupo,
  type Tarifa,
} from "@/lib/costes";
import { crearPagoExtra, borrarPagoExtra } from "./actions";

type Entrenador = { id: string; nombre: string; rol: "director" | "entrenador" };
type Asignacion = { grupo_id: number; entrenador_id: string };
type SemanaAsignaciones = { semana: string; asignaciones: Asignacion[] };
type PagoExtra = { id: number; entrenador_id: string; concepto: string; importe: number };

function formatMes(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const texto = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function calcularFilas(
  grupos: Grupo[],
  entrenadores: Entrenador[],
  asignaciones: Asignacion[],
  tarifas: Tarifa[],
) {
  return entrenadores.map((e) => {
    const gruposDe = grupos.filter((g) =>
      asignaciones.some((a) => a.grupo_id === g.id && a.entrenador_id === e.id),
    );
    const porDisciplina: Record<string, number> = {};
    let coste = 0;
    let completo = true;
    for (const g of gruposDe) {
      const h = horasSemanales(g);
      const t = tarifaDe(e.id, g.disciplina, tarifas);
      if (h == null || t == null) {
        completo = false;
        continue;
      }
      porDisciplina[g.disciplina] = (porDisciplina[g.disciplina] ?? 0) + h;
      coste += h * t;
    }
    return { entrenador: e, porDisciplina, coste, completo };
  });
}

export function PagosView({
  mes,
  mesAnterior,
  mesSiguiente,
  grupos,
  entrenadores,
  tarifas,
  asignacionesPorSemana,
  pagosExtra,
}: {
  mes: string;
  mesAnterior: string;
  mesSiguiente: string;
  grupos: Grupo[];
  entrenadores: Entrenador[];
  tarifas: Tarifa[];
  asignacionesPorSemana: SemanaAsignaciones[];
  pagosExtra: PagoExtra[];
}) {
  const router = useRouter();
  const [entrenadorId, setEntrenadorId] = useState(entrenadores[0]?.id ?? "");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [borrando, setBorrando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disciplinas = [...new Set(grupos.map((g) => g.disciplina))];

  const filasPorSemana = asignacionesPorSemana.map(({ semana, asignaciones }) => ({
    semana,
    filas: calcularFilas(grupos, entrenadores, asignaciones, tarifas),
  }));

  // Agregado del mes: se suman las semanas ya calculadas, no se recalcula
  // desde cero, porque un mismo grupo puede haber tenido un entrenador
  // distinto cada semana.
  const horasMes: Record<string, Record<string, number>> = {};
  const costeMes: Record<string, number> = {};
  const completoMes: Record<string, boolean> = {};
  for (const { filas } of filasPorSemana) {
    for (const f of filas) {
      const id = f.entrenador.id;
      horasMes[id] ??= {};
      for (const [d, h] of Object.entries(f.porDisciplina)) {
        horasMes[id][d] = (horasMes[id][d] ?? 0) + h;
      }
      costeMes[id] = (costeMes[id] ?? 0) + f.coste;
      completoMes[id] = (completoMes[id] ?? true) && f.completo;
    }
  }

  const conceptosExtra = [...new Set(pagosExtra.map((p) => p.concepto))];
  const extraPorEntrenadorConcepto: Record<string, Record<string, number>> = {};
  const extraTotalPorEntrenador: Record<string, number> = {};
  for (const p of pagosExtra) {
    extraPorEntrenadorConcepto[p.entrenador_id] ??= {};
    extraPorEntrenadorConcepto[p.entrenador_id][p.concepto] =
      (extraPorEntrenadorConcepto[p.entrenador_id][p.concepto] ?? 0) + Number(p.importe);
    extraTotalPorEntrenador[p.entrenador_id] =
      (extraTotalPorEntrenador[p.entrenador_id] ?? 0) + Number(p.importe);
  }

  function totalDe(entrenadorId: string) {
    return (costeMes[entrenadorId] ?? 0) + (extraTotalPorEntrenador[entrenadorId] ?? 0);
  }

  const directores = entrenadores.filter((e) => e.rol === "director");
  const totalConTodos = entrenadores.reduce((s, e) => s + totalDe(e.id), 0);
  const totalSinDirector = entrenadores
    .filter((e) => e.rol !== "director")
    .reduce((s, e) => s + totalDe(e.id), 0);

  async function onAnadirExtra() {
    setError(null);
    const importeNum = Number(importe.replace(",", "."));
    if (!entrenadorId) {
      setError("Elige un entrenador");
      return;
    }
    if (!concepto.trim()) {
      setError("Falta el concepto");
      return;
    }
    if (!(importeNum > 0)) {
      setError("El importe tiene que ser mayor que cero");
      return;
    }
    setEnviando(true);
    const resultado = await crearPagoExtra({ entrenadorId, mes, concepto, importe: importeNum });
    setEnviando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setConcepto("");
    setImporte("");
    router.refresh();
  }

  async function onBorrarExtra(id: number) {
    setBorrando(id);
    setError(null);
    const resultado = await borrarPagoExtra(id);
    setBorrando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  const huboIncompletos = Object.values(completoMes).some((c) => !c);

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Pagos a entrenadores
      </h2>

      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/pagos?mes=${mesAnterior}`}
          className="text-mute hover:text-chalk px-2 py-1"
          aria-label="Mes anterior"
        >
          ←
        </Link>
        <div className="font-display text-sm tracking-[.08em] uppercase text-mute">
          {formatMes(mes)}
        </div>
        <Link
          href={`/pagos?mes=${mesSiguiente}`}
          className="text-mute hover:text-chalk px-2 py-1"
          aria-label="Mes siguiente"
        >
          →
        </Link>
      </div>

      {entrenadores.length === 0 && (
        <p className="text-mute text-sm mb-4">
          No hay entrenadores dados de alta todavía. Apruébalos en Equipo primero.
        </p>
      )}

      {filasPorSemana.map(({ semana, filas }, i) => (
        <div key={semana} className="mb-5">
          <h3 className="font-display text-[13px] tracking-[.12em] uppercase text-signal mb-2">
            Semana {i + 1}
          </h3>
          <div className="overflow-x-auto -mx-[18px] px-[18px]">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-edge">
                  <th className="text-left py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                    Entrenador
                  </th>
                  {disciplinas.map((d) => (
                    <th
                      key={d}
                      className="text-right py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute"
                    >
                      {DISCIPLINA_LABEL[d] ?? d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.entrenador.id} className="border-b border-edge/60">
                    <td className="py-2 pr-3">{f.entrenador.nombre}</td>
                    {disciplinas.map((d) => (
                      <td key={d} className="py-2 pr-3 text-right tabular-nums">
                        {f.porDisciplina[d] ? f.porDisciplina[d] : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {filasPorSemana.length === 0 && (
        <p className="text-mute text-sm mb-5">Este mes no tiene ningún reparto guardado.</p>
      )}

      <h3 className="font-display text-[13px] tracking-[.12em] uppercase text-signal mb-2">
        Total {formatMes(mes)}
      </h3>
      <div className="overflow-x-auto -mx-[18px] px-[18px] mb-2">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge">
              <th className="text-left py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                Entrenador
              </th>
              {disciplinas.map((d) => (
                <th
                  key={d}
                  className="text-right py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute"
                >
                  {DISCIPLINA_LABEL[d] ?? d}
                </th>
              ))}
              <th className="text-right py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute">
                Total
              </th>
              {conceptosExtra.map((c) => (
                <th
                  key={c}
                  className="text-right py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entrenadores.map((e) => (
              <tr key={e.id} className="border-b border-edge/60">
                <td className="py-2 pr-3 font-medium">{e.nombre}</td>
                {disciplinas.map((d) => (
                  <td key={d} className="py-2 pr-3 text-right tabular-nums">
                    {horasMes[e.id]?.[d] ? horasMes[e.id][d] : "—"}
                  </td>
                ))}
                <td className="py-2 pr-3 text-right font-display font-semibold tabular-nums">
                  {totalDe(e.id).toFixed(2)} €{!completoMes[e.id] && "*"}
                </td>
                {conceptosExtra.map((c) => (
                  <td key={c} className="py-2 pr-3 text-right tabular-nums text-mute">
                    {extraPorEntrenadorConcepto[e.id]?.[c]
                      ? extraPorEntrenadorConcepto[e.id][c].toFixed(0)
                      : "—"}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-edge">
              <td className="py-2 pr-3 font-display font-semibold">TOTAL CON TODOS</td>
              <td colSpan={disciplinas.length} />
              <td className="py-2 pr-3 text-right font-display font-semibold tabular-nums">
                {totalConTodos.toFixed(2)} €
              </td>
            </tr>
            {directores.length > 0 && (
              <tr>
                <td className="py-2 pr-3 font-display font-semibold">
                  TOTAL SIN {directores.map((d) => d.nombre).join(" Y ").toUpperCase()}
                </td>
                <td colSpan={disciplinas.length} />
                <td className="py-2 pr-3 text-right font-display font-semibold tabular-nums">
                  {totalSinDirector.toFixed(2)} €
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {huboIncompletos && (
        <p className="text-xs text-mute mb-4">
          * Hay algún grupo sin horario fijo (ej. Ciclismo Carretera) o sin tarifa definida
          para esa disciplina, así que ese coste no está completo.
        </p>
      )}

      <div className="lane my-4" />

      <h3 className="font-display text-[13px] tracking-[.12em] uppercase text-mute mb-2">
        Añadir pago extra
      </h3>
      <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3.5">
        <select
          value={entrenadorId}
          onChange={(e) => setEntrenadorId(e.target.value)}
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-2"
        >
          {entrenadores.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <input
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Concepto (ej. gsd, competiciones)"
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-2"
        />
        <input
          inputMode="decimal"
          value={importe}
          onChange={(e) => setImporte(e.target.value)}
          placeholder="Importe (€)"
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-3"
        />
        {error && <p className="text-run text-sm mb-2">{error}</p>}
        <button
          onClick={onAnadirExtra}
          disabled={enviando}
          className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
        >
          {enviando ? "Añadiendo…" : "Añadir"}
        </button>
      </div>

      {pagosExtra.length > 0 && (
        <div className="mb-2">
          {pagosExtra.map((p) => {
            const nombre = entrenadores.find((e) => e.id === p.entrenador_id)?.nombre ?? "?";
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3 mb-2"
              >
                <span className="text-sm min-w-0 truncate">
                  <b className="font-medium">{nombre}</b> · {p.concepto} ·{" "}
                  {Number(p.importe).toFixed(2)} €
                </span>
                <button
                  onClick={() => onBorrarExtra(p.id)}
                  disabled={borrando === p.id}
                  className="shrink-0 min-h-[36px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                >
                  {borrando === p.id ? "…" : "Borrar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
