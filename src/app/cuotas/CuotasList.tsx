"use client";

type Cuota = {
  id: number;
  nombre_deportista: string;
  importe: number;
  estado: string;
  creado_en: string;
};

const LABEL_ESTADO: Record<string, { texto: string; color: string }> = {
  activa: { texto: "Activa", color: "#A8D84A" },
  cancelada: { texto: "Cancelada", color: "#7FA5B0" },
  impago: { texto: "Impago", color: "#FF6B6B" },
};

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function CuotasList({ cuotas }: { cuotas: Cuota[] }) {
  const activas = cuotas.filter((c) => c.estado === "activa");
  const totalMensual = activas.reduce((s, c) => s + c.importe, 0);

  if (cuotas.length === 0) {
    return (
      <p className="text-mute text-sm text-center py-9">
        Todavía nadie ha pagado la cuota por este enlace.
      </p>
    );
  }

  return (
    <div>
      <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3.5">
        <span className="text-xs text-mute block mb-0.5">Cuotas activas ahora mismo</span>
        <b className="text-2xl font-display text-chalk">
          {activas.length} · {totalMensual.toFixed(0)} €/mes
        </b>
      </div>

      {cuotas.map((c) => {
        const estado = LABEL_ESTADO[c.estado] ?? { texto: c.estado, color: "#7FA5B0" };
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
            <span
              className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px] shrink-0"
              style={{ backgroundColor: `${estado.color}25`, color: estado.color }}
            >
              {estado.texto}
            </span>
          </div>
        );
      })}
    </div>
  );
}
