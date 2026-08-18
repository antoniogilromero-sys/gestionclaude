"use client";

export function ImprimirButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-signal text-[#160800] rounded-lg px-4 py-2 font-display text-xs tracking-[.08em] uppercase font-semibold cursor-pointer"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
