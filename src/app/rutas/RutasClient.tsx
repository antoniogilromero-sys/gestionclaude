"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sincronizarRutas } from "./actions";

type Ruta = {
  id: number;
  tipo: "carretera" | "montana";
  nombre: string;
  distanciaKm: number | null;
  desnivelM: number | null;
  fecha: string;
  deportista: string;
};

const COLOR_TIPO: Record<Ruta["tipo"], string> = {
  carretera: "#43C6E0",
  montana: "#A8D84A",
};
const LABEL_TIPO: Record<Ruta["tipo"], string> = {
  carretera: "Carretera",
  montana: "Montaña",
};

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function RutasClient({ rutas, esDirector }: { rutas: Ruta[]; esDirector: boolean }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"todas" | "carretera" | "montana">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return rutas.filter((r) => {
      if (tipo !== "todas" && r.tipo !== tipo) return false;
      if (q && !r.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rutas, tipo, busqueda]);

  async function onSincronizar() {
    setSincronizando(true);
    setError(null);
    setMensaje(null);
    const resultado = await sincronizarRutas();
    setSincronizando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setMensaje(`${resultado.sincronizadas} salidas de ciclismo guardadas/actualizadas.`);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Rutas ({rutas.length})
        </h2>
        {esDirector && (
          <button
            onClick={onSincronizar}
            disabled={sincronizando}
            className="bg-signal text-[#160800] rounded-lg px-3 py-1.5 font-display text-xs tracking-[.06em] uppercase font-semibold cursor-pointer disabled:opacity-60 shrink-0"
          >
            {sincronizando ? "Sincronizando…" : "Sincronizar rutas"}
          </button>
        )}
      </div>

      <p className="text-xs text-mute leading-relaxed mb-3.5">
        Salidas de ciclismo reales de quienes tienen Strava conectado, de los últimos 90 días de
        cada sincronización. {esDirector && "Pulsa \"Sincronizar rutas\" para traer las nuevas."}
      </p>

      {mensaje && <p className="text-signal text-sm mb-3">{mensaje}</p>}
      {error && <p className="text-run text-sm mb-3">{error}</p>}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {(["todas", "carretera", "montana"] as const).map((t) => {
          const on = tipo === t;
          const c = t === "todas" ? "#7FA5B0" : COLOR_TIPO[t];
          return (
            <button
              key={t}
              onClick={() => setTipo(t)}
              aria-pressed={on}
              style={on ? { backgroundColor: c, borderColor: c, color: "#160800" } : { borderColor: c, color: c }}
              className="px-3 py-1.5 rounded-full border font-display text-xs tracking-[.04em] cursor-pointer font-semibold"
            >
              {t === "todas" ? "Todas" : LABEL_TIPO[t]}
            </button>
          );
        })}
      </div>

      <input
        placeholder="Buscar por nombre de la ruta…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-3.5"
      />

      {filtradas.length === 0 ? (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">Aquí no hay nada todavía</b>
          {esDirector
            ? "Pulsa \"Sincronizar rutas\" para traer las salidas de quienes tienen Strava conectado."
            : "Pídele al director que sincronice rutas desde Strava."}
        </div>
      ) : (
        filtradas.map((r) => (
          <a
            key={r.id}
            href={`https://www.strava.com/activities/${r.id}`}
            target="_blank"
            rel="noreferrer"
            className="block bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
          >
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span
                className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px]"
                style={{ backgroundColor: `${COLOR_TIPO[r.tipo]}25`, color: COLOR_TIPO[r.tipo] }}
              >
                {LABEL_TIPO[r.tipo]}
              </span>
              <span className="text-xs text-mute">{fmtFecha(r.fecha)}</span>
              <span className="text-xs text-mute">· {r.deportista}</span>
            </div>
            <b className="block text-[15px] font-medium mb-1">{r.nombre}</b>
            <div className="flex gap-4 text-[13px] text-mute">
              {r.distanciaKm != null && <span>{r.distanciaKm.toFixed(1)} km</span>}
              {r.desnivelM != null && <span>▲ {Math.round(r.desnivelM)} m</span>}
            </div>
          </a>
        ))
      )}
    </div>
  );
}
