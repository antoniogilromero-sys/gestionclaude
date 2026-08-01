"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { borrarPedido } from "./actions";

type Pedido = {
  id: number;
  articulo: "camiseta" | "sudadera";
  talla: string;
  cantidad: number;
  creado_en: string;
  deportistaNombre: string;
};

export function PedidosList({ pedidos }: { pedidos: Pedido[] }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalCamisetas = pedidos
    .filter((p) => p.articulo === "camiseta")
    .reduce((s, p) => s + p.cantidad, 0);
  const totalSudaderas = pedidos
    .filter((p) => p.articulo === "sudadera")
    .reduce((s, p) => s + p.cantidad, 0);

  async function onBorrar(id: number) {
    setBorrando(id);
    setError(null);
    const resultado = await borrarPedido(id);
    setBorrando(null);
    setConfirmando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
        <b className="block text-chalk text-base mb-[5px] font-medium">
          Todavía no hay ninguno
        </b>
        Añade el primer pedido de camiseta o sudadera cuando quieras.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
          <b className="font-display text-[26px] block leading-none">{totalCamisetas}</b>
          <span className="text-[11px] text-mute tracking-[.04em]">CAMISETAS</span>
        </div>
        <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
          <b className="font-display text-[26px] block leading-none">{totalSudaderas}</b>
          <span className="text-[11px] text-mute tracking-[.04em]">SUDADERAS</span>
        </div>
      </div>

      {error && <p className="text-run text-sm mb-3.5">{error}</p>}

      {pedidos.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
        >
          <div className="min-w-0">
            <b className="block text-[15px] font-medium truncate">{p.deportistaNombre}</b>
            <span className="text-xs text-mute truncate block">
              {p.articulo === "camiseta" ? "Camiseta" : "Sudadera"} · talla {p.talla}
              {p.cantidad > 1 && ` · x${p.cantidad}`}
            </span>
          </div>
          {confirmando === p.id ? (
            <div className="shrink-0 flex gap-1.5">
              <button
                onClick={() => onBorrar(p.id)}
                disabled={borrando === p.id}
                className="min-h-[44px] px-3 rounded-lg border border-run text-run font-display text-xs tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
              >
                {borrando === p.id ? "Borrando…" : "Sí, borrar"}
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
              onClick={() => setConfirmando(p.id)}
              className="shrink-0 min-h-[44px] px-3 rounded-lg border border-edge text-mute font-display text-xs tracking-[.06em] uppercase cursor-pointer"
            >
              Borrar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
