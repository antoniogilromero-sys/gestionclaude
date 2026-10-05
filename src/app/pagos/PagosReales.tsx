"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPagoReal, borrarPagoReal } from "./actions";

export type FilaReal = {
  id: string;
  nombre: string;
  reparto: number;
  extras: number;
  realId: number | null;
  real: number | null;
  nota: string | null;
};

function euros(n: number) {
  return `${n.toFixed(2)} €`;
}

function Diferencia({ n }: { n: number }) {
  const ok = Math.abs(n) < 0.005;
  const signo = n > 0 ? "+" : "";
  return (
    <span className={ok ? "text-ok" : "text-run"}>
      {ok ? "0.00 €" : `${signo}${n.toFixed(2)} €`}
    </span>
  );
}

// Compara lo que calcula la app (reparto x tarifa + pagos extra) con lo que
// de verdad se abona, entrenador por entrenador. "Dif." = real - app: si es
// positiva, se paga MÁS de lo que calcula la app.
export function PagosReales({
  mes,
  filas,
  error,
}: {
  mes: string;
  filas: FilaReal[];
  error: string | null;
}) {
  const router = useRouter();
  const [entrenadorId, setEntrenadorId] = useState(filas[0]?.id ?? "");
  const [importe, setImporte] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [borrando, setBorrando] = useState<number | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  if (error) {
    return (
      <div className="bg-surf border border-run/40 rounded-[10px] p-3.5 mb-4">
        <b className="block text-[15px] font-medium mb-1 text-run">
          Falta activar los pagos reales
        </b>
        <p className="text-sm text-mute leading-relaxed">
          Hay que ejecutar la migración de pagos reales en Supabase. Detalle técnico: {error}
        </p>
      </div>
    );
  }

  const conReal = filas.filter((f) => f.real != null);
  const sinReal = filas.filter((f) => f.real == null && f.reparto + f.extras > 0);
  const totalApp = conReal.reduce((s, f) => s + f.reparto + f.extras, 0);
  const totalReal = conReal.reduce((s, f) => s + (f.real ?? 0), 0);

  async function onGuardar() {
    setErrorForm(null);
    const n = Number(importe.replace(",", "."));
    if (!entrenadorId) {
      setErrorForm("Elige un entrenador");
      return;
    }
    if (importe.trim() === "" || !(n >= 0)) {
      setErrorForm("Escribe el importe real");
      return;
    }
    setEnviando(true);
    const resultado = await guardarPagoReal({ entrenadorId, mes, importe: n, nota });
    setEnviando(false);
    if ("error" in resultado) {
      setErrorForm(resultado.error);
      return;
    }
    setImporte("");
    setNota("");
    router.refresh();
  }

  async function onBorrar(id: number) {
    setBorrando(id);
    setErrorForm(null);
    const resultado = await borrarPagoReal(id);
    setBorrando(null);
    if ("error" in resultado) setErrorForm(resultado.error);
    else router.refresh();
  }

  return (
    <div className="mb-5">
      <h3 className="font-display text-[13px] tracking-[.12em] uppercase text-signal mb-1">
        Pagos reales frente a la app
      </h3>
      <p className="text-xs text-mute leading-relaxed mb-2.5">
        Lo que de verdad se abona a cada entrenador este mes, comparado con lo que calcula la app
        (reparto + extras). Diferencia = real − app.
      </p>

      {conReal.length === 0 ? (
        <p className="text-mute text-sm bg-surf border border-edge rounded-[10px] p-3 mb-3">
          Todavía no has anotado ninguna cantidad real de este mes.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-[18px] px-[18px] mb-2">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-edge">
                {["Entrenador", "Reparto", "Extras", "App", "Real", "Dif."].map((h, i) => (
                  <th
                    key={h}
                    className={`py-2 pr-3 font-display text-[11px] tracking-[.08em] uppercase text-mute ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {conReal.map((f) => {
                const app = f.reparto + f.extras;
                return (
                  <tr key={f.id} className="border-b border-edge/60">
                    <td className="py-2 pr-3">
                      <span className="font-medium">{f.nombre}</span>
                      {f.nota && <span className="block text-xs text-mute">{f.nota}</span>}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{euros(f.reparto)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-mute">
                      {f.extras ? euros(f.extras) : "—"}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{euros(app)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums font-semibold">
                      {euros(f.real ?? 0)}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums font-semibold">
                      <Diferencia n={(f.real ?? 0) - app} />
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => f.realId != null && onBorrar(f.realId)}
                        disabled={borrando === f.realId}
                        className="text-mute text-[11px] underline cursor-pointer disabled:opacity-60"
                      >
                        {borrando === f.realId ? "…" : "quitar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-edge">
                <td className="py-2 pr-3 font-display font-semibold">TOTAL</td>
                <td colSpan={2} />
                <td className="py-2 pr-3 text-right font-display font-semibold tabular-nums">
                  {euros(totalApp)}
                </td>
                <td className="py-2 pr-3 text-right font-display font-semibold tabular-nums">
                  {euros(totalReal)}
                </td>
                <td className="py-2 pr-3 text-right font-display font-semibold tabular-nums">
                  <Diferencia n={totalReal - totalApp} />
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {sinReal.length > 0 && (
        <p className="text-xs text-mute leading-relaxed mb-3">
          Sin cantidad real anotada (no entran en el total):{" "}
          {sinReal.map((f) => `${f.nombre} (app: ${euros(f.reparto + f.extras)})`).join(", ")}.
        </p>
      )}

      <div className="bg-surf border border-edge rounded-[10px] p-3.5">
        <span className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-2">
          Anotar o corregir una cantidad real
        </span>
        <select
          value={entrenadorId}
          onChange={(e) => setEntrenadorId(e.target.value)}
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-2"
        >
          {filas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
        <input
          inputMode="decimal"
          value={importe}
          onChange={(e) => setImporte(e.target.value)}
          placeholder="Importe real (€)"
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-2"
        />
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota (opcional, ej. incluye Gredos)"
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-3"
        />
        {errorForm && <p className="text-run text-sm mb-2">{errorForm}</p>}
        <button
          onClick={onGuardar}
          disabled={enviando}
          className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}
