"use client";

import { useState } from "react";

const OPCIONES = [44, 30] as const;

export function CuotaForm() {
  const [nombre, setNombre] = useState("");
  const [importe, setImporte] = useState<(typeof OPCIONES)[number] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPagar() {
    setError(null);
    if (!nombre.trim()) {
      setError("Escribe el nombre del deportista o socio.");
      return;
    }
    if (!importe) {
      setError("Elige el importe de la cuota.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/cuotas/crear-sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), importe }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "No se ha podido iniciar el pago. Inténtalo de nuevo.");
        setEnviando(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("No se ha podido conectar con el pago. Inténtalo de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="bg-surf border border-edge rounded-[14px] p-5">
      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1.5">
        Nombre del deportista o socio
      </label>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre y apellidos"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-4"
      />

      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1.5">
        Importe de la cuota
      </label>
      <div className="flex gap-2 mb-5">
        {OPCIONES.map((op) => {
          const on = importe === op;
          return (
            <button
              key={op}
              type="button"
              onClick={() => setImporte(op)}
              aria-pressed={on}
              className={`flex-1 min-h-[52px] rounded-lg border font-display text-base tracking-[.02em] cursor-pointer ${
                on
                  ? "bg-signal text-[#160800] border-signal font-semibold"
                  : "bg-deep text-chalk border-edge"
              }`}
            >
              {op} €/mes
            </button>
          );
        })}
      </div>

      {error && <p className="text-run text-sm mb-4">{error}</p>}

      <button
        onClick={onPagar}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[10px] py-3 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
      >
        {enviando ? "Redirigiendo a pago seguro…" : "Pagar cuota mensual"}
      </button>
      <p className="text-mute text-xs text-center mt-3 leading-relaxed">
        El pago lo procesa Stripe de forma segura. Es un cargo mensual automático hasta que se
        cancele; puedes darlo de baja cuando quieras contactando con el club.
      </p>
    </div>
  );
}
