"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cambiarFechaSesion } from "./actions";

export function CambiarFecha({ sesionId, fechaActual }: { sesionId: number; fechaActual: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [fecha, setFecha] = useState(fechaActual);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGuardar() {
    setGuardando(true);
    setError(null);
    const resultado = await cambiarFechaSesion(sesionId, fecha);
    setGuardando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setEditando(false);
    router.refresh();
  }

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="mt-3 w-full min-h-[44px] bg-transparent border border-edge text-chalk rounded-lg font-display text-xs tracking-[.08em] uppercase cursor-pointer"
      >
        Cambiar fecha
      </button>
    );
  }

  return (
    <div className="mt-3 bg-surf border border-edge rounded-[10px] p-3">
      <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
        Nueva fecha
      </label>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-2.5"
      />
      {error && <p className="text-run text-sm mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onGuardar}
          disabled={guardando || !fecha}
          className="flex-1 min-h-[44px] bg-signal text-[#160800] rounded-lg font-display text-xs tracking-[.08em] uppercase font-semibold cursor-pointer disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar fecha"}
        </button>
        <button
          onClick={() => {
            setEditando(false);
            setFecha(fechaActual);
            setError(null);
          }}
          disabled={guardando}
          className="flex-1 min-h-[44px] bg-transparent border border-edge text-chalk rounded-lg font-display text-xs tracking-[.08em] uppercase cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
