"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sincronizarPagos } from "./actions";

type Cuota = {
  id: number;
  nombre_deportista: string;
  importe: number;
  estado: string;
  creado_en: string;
};

type PagoDelMes = { cuota_id: number; fecha: string; importe: number; estado: string };

const LABEL_ESTADO: Record<string, { texto: string; color: string }> = {
  activa: { texto: "Activa", color: "#A8D84A" },
  cancelada: { texto: "Cancelada", color: "#7FA5B0" },
  impago: { texto: "Impago", color: "#FF6B6B" },
};

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function nombreMesActual() {
  const texto = new Date().toLocaleDateString("es-ES", { month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function CuotasList({
  cuotas,
  pagosDelMes,
}: {
  cuotas: Cuota[];
  pagosDelMes: PagoDelMes[];
}) {
  const router = useRouter();
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pagadoEsteMes = useMemo(() => {
    const set = new Set<number>();
    for (const p of pagosDelMes) {
      if (p.estado === "pagado") set.add(p.cuota_id);
    }
    return set;
  }, [pagosDelMes]);

  const activas = cuotas.filter((c) => c.estado === "activa");
  const totalMensual = activas.reduce((s, c) => s + c.importe, 0);
  const sinPagarEsteMes = activas.filter((c) => !pagadoEsteMes.has(c.id));

  async function onSincronizar() {
    setSincronizando(true);
    setError(null);
    setMensaje(null);
    const resultado = await sincronizarPagos();
    setSincronizando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setMensaje(`Traídas ${resultado.actualizados} facturas desde Stripe.`);
    router.refresh();
  }

  if (cuotas.length === 0) {
    return (
      <div>
        <BotonSincronizar sincronizando={sincronizando} onClick={onSincronizar} />
        {error && <p className="text-run text-sm mb-3.5">{error}</p>}
        {mensaje && <p className="text-mute text-sm mb-3.5">{mensaje}</p>}
        <p className="text-mute text-sm text-center py-9">
          Todavía nadie ha pagado la cuota por este enlace.
        </p>
      </div>
    );
  }

  return (
    <div>
      <BotonSincronizar sincronizando={sincronizando} onClick={onSincronizar} />
      {error && <p className="text-run text-sm mb-3.5">{error}</p>}
      {mensaje && <p className="text-mute text-sm mb-3.5">{mensaje}</p>}

      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <div className="bg-surf border border-edge rounded-[10px] p-3">
          <span className="text-xs text-mute block mb-0.5">Cuotas activas</span>
          <b className="text-2xl font-display text-chalk">
            {activas.length} · {totalMensual.toFixed(0)} €/mes
          </b>
        </div>
        <div
          className={`bg-surf border rounded-[10px] p-3 ${
            sinPagarEsteMes.length > 0 ? "border-run/40" : "border-ok/40"
          }`}
        >
          <span className="text-xs text-mute block mb-0.5">Sin pagar en {nombreMesActual()}</span>
          <b
            className={`text-2xl font-display ${
              sinPagarEsteMes.length > 0 ? "text-run" : "text-ok"
            }`}
          >
            {sinPagarEsteMes.length}
          </b>
        </div>
      </div>

      {sinPagarEsteMes.length > 0 && (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3 mb-3.5 space-y-1">
          {sinPagarEsteMes.map((c) => (
            <p key={c.id} className="text-run text-[13px]">
              {c.nombre_deportista} todavía no tiene un cobro registrado este mes
            </p>
          ))}
        </div>
      )}

      {cuotas.map((c) => {
        const estado = LABEL_ESTADO[c.estado] ?? { texto: c.estado, color: "#7FA5B0" };
        const pagado = c.estado === "activa" && pagadoEsteMes.has(c.id);
        return (
          <div
            key={c.id}
            className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3 mb-2"
          >
            <div className="min-w-0">
              <b className="block text-[15px] font-medium truncate">{c.nombre_deportista}</b>
              <span className="text-xs text-mute">
                {c.importe} €/mes · desde {fmtFecha(c.creado_en)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {c.estado === "activa" && (
                <span
                  className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px]"
                  style={
                    pagado
                      ? { backgroundColor: "#A8D84A25", color: "#A8D84A" }
                      : { backgroundColor: "#FF6B6B25", color: "#FF6B6B" }
                  }
                >
                  {pagado ? `Pagado ${nombreMesActual()}` : "Sin pagar este mes"}
                </span>
              )}
              <span
                className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px]"
                style={{ backgroundColor: `${estado.color}25`, color: estado.color }}
              >
                {estado.texto}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BotonSincronizar({ sincronizando, onClick }: { sincronizando: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={sincronizando}
      className="w-full bg-transparent border border-edge text-chalk rounded-[9px] py-2.5 font-display text-sm tracking-[.05em] uppercase cursor-pointer mb-3.5 disabled:opacity-60"
    >
      {sincronizando ? "Sincronizando…" : "Sincronizar pagos con Stripe"}
    </button>
  );
}
