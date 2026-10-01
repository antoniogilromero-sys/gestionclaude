import Link from "next/link";

type Cobro = {
  id: string;
  fecha: string;
  importe: number;
  pagador: string;
  descripcion: string;
  estado: "succeeded" | "pending" | "failed";
};

const LABEL_ESTADO: Record<Cobro["estado"], { texto: string; color: string }> = {
  succeeded: { texto: "Cobrado", color: "#A8D84A" },
  pending: { texto: "Pendiente", color: "#E8B339" },
  failed: { texto: "Fallido", color: "#FF6B6B" },
};

function fmtFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMes(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const texto = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Cobros reales de la cuenta de Stripe del club, pedidos en directo cada
// vez que se abre esta pantalla (nada se guarda) — para los que Antón
// gestiona él mismo dentro de Stripe, sin pasar por el checkout de
// /cuota. Si algún día esos cobros también pasaran por /cuota, saldrían
// aquí Y en el listado de arriba (son dos orígenes distintos, no se
// cruzan entre sí).
export function CobrosStripe({
  mes,
  mesAnterior,
  mesSiguiente,
  cobros,
  error,
}: {
  mes: string;
  mesAnterior: string;
  mesSiguiente: string;
  cobros: Cobro[];
  error: string | null;
}) {
  const totalCobrado = cobros
    .filter((c) => c.estado === "succeeded")
    .reduce((s, c) => s + c.importe, 0);

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Cobros en Stripe
      </h2>
      <p className="text-xs text-mute leading-relaxed mb-3">
        Lo que de verdad ha entrado en tu cuenta de Stripe, lo gestiones donde lo gestiones —
        enlace de pago, factura manual, etc. Se trae en directo cada vez, no es un listado
        guardado.
      </p>

      <div className="flex items-center justify-between mb-3">
        <Link
          href={`/cuotas?mes=${mesAnterior}`}
          className="text-mute hover:text-chalk px-2 py-1"
          aria-label="Mes anterior"
        >
          ←
        </Link>
        <div className="font-display text-sm tracking-[.08em] uppercase text-mute">
          {formatMes(mes)}
        </div>
        <Link
          href={`/cuotas?mes=${mesSiguiente}`}
          className="text-mute hover:text-chalk px-2 py-1"
          aria-label="Mes siguiente"
        >
          →
        </Link>
      </div>

      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido conectar con Stripe
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Revisa que `STRIPE_SECRET_KEY` esté bien puesta en las variables de entorno de
            Vercel. Detalle técnico: {error}
          </p>
        </div>
      ) : cobros.length === 0 ? (
        <p className="text-mute text-sm text-center py-6">
          Ningún cobro registrado en Stripe este mes.
        </p>
      ) : (
        <>
          <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3.5">
            <span className="text-xs text-mute block mb-0.5">Total cobrado</span>
            <b className="text-2xl font-display text-chalk">{totalCobrado.toFixed(2)} €</b>
          </div>

          {cobros.map((c) => {
            const estado = LABEL_ESTADO[c.estado];
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3 mb-2"
              >
                <div className="min-w-0">
                  <b className="block text-[15px] font-medium truncate">{c.pagador}</b>
                  <span className="text-xs text-mute truncate block">
                    {fmtFecha(c.fecha)}
                    {c.descripcion && ` · ${c.descripcion}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-display text-[17px] font-semibold">
                    {c.importe.toFixed(2)} €
                  </span>
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
        </>
      )}
    </div>
  );
}
