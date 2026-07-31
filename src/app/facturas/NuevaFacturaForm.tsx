"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { emitirFactura } from "./actions";

export function NuevaFacturaForm() {
  const router = useRouter();
  const [pagadorNombre, setPagadorNombre] = useState("");
  const [pagadorNif, setPagadorNif] = useState("");
  const [pagadorDireccion, setPagadorDireccion] = useState("");
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function emitir() {
    setError(null);
    const importeNum = Number(importe.replace(",", "."));
    if (!pagadorNombre.trim() || !pagadorNif.trim() || !concepto.trim()) {
      setError("Faltan el nombre, el NIF o el concepto");
      return;
    }
    if (!(importeNum > 0)) {
      setError("El importe tiene que ser mayor que cero");
      return;
    }
    setEnviando(true);
    try {
      const numero = await emitirFactura({
        pagadorNombre,
        pagadorNif,
        pagadorDireccion,
        concepto,
        importe: importeNum,
      });
      router.push(`/facturas/${numero}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo emitir la factura");
      setEnviando(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Nueva factura
      </h2>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Nombre de quien paga
      </label>
      <input
        value={pagadorNombre}
        onChange={(e) => setPagadorNombre(e.target.value)}
        placeholder="Nombre y apellidos"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        NIF / DNI de quien paga
      </label>
      <input
        value={pagadorNif}
        onChange={(e) => setPagadorNif(e.target.value.toUpperCase())}
        placeholder="12345678A"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Dirección (opcional)
      </label>
      <input
        value={pagadorDireccion}
        onChange={(e) => setPagadorDireccion(e.target.value)}
        placeholder="Calle, número, población"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Concepto
      </label>
      <input
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
        placeholder="Cuota mensual julio 2026 — nombre del deportista"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Importe (€)
      </label>
      <input
        inputMode="decimal"
        value={importe}
        onChange={(e) => setImporte(e.target.value)}
        placeholder="44,00"
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      {error && <p className="text-run text-sm mt-3">{error}</p>}

      <button
        onClick={emitir}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer mt-4 disabled:opacity-60"
      >
        {enviando ? "Emitiendo…" : "Emitir factura"}
      </button>
      <p className="text-xs text-mute leading-relaxed mt-3.5 pt-3 border-t border-edge">
        El número se asigna solo, siguiendo la numeración correlativa. Una vez
        emitida, la factura no se puede editar ni borrar — es lo que exige
        Hacienda. Revisa los datos antes de emitir.
      </p>
    </div>
  );
}
