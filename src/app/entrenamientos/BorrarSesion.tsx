"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { borrarSesion } from "./actions";

export function BorrarSesion({ sesionId }: { sesionId: number }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onBorrar() {
    setBorrando(true);
    setError(null);
    const resultado = await borrarSesion(sesionId);
    if ("error" in resultado) {
      setError(resultado.error);
      setBorrando(false);
      setConfirmando(false);
      return;
    }
    router.push("/entrenamientos");
    router.refresh();
  }

  return (
    <div className="mt-3">
      {error && <p className="text-run text-sm mb-2">{error}</p>}
      {confirmando ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3">
          <p className="text-sm mb-2.5">
            ¿Seguro que quieres borrar este entrenamiento? Desaparece para todos y no se puede
            recuperar.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onBorrar}
              disabled={borrando}
              className="flex-1 min-h-[44px] bg-transparent border border-run text-run rounded-lg font-display text-xs tracking-[.08em] uppercase cursor-pointer disabled:opacity-60"
            >
              {borrando ? "Borrando…" : "Sí, borrar"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={borrando}
              className="flex-1 min-h-[44px] bg-transparent border border-edge text-chalk rounded-lg font-display text-xs tracking-[.08em] uppercase cursor-pointer"
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmando(true)}
          className="w-full min-h-[44px] bg-transparent border border-edge text-mute rounded-lg font-display text-xs tracking-[.08em] uppercase cursor-pointer"
        >
          Borrar este entrenamiento
        </button>
      )}
    </div>
  );
}
