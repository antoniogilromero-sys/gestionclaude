"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sincronizarRutas } from "./actions";
import { sinAcentos } from "@/lib/texto";

type Ruta = {
  id: number;
  tipo: "carretera" | "montana";
  nombre: string;
  distanciaKm: number | null;
  desnivelM: number | null;
  fecha: string;
  deportista: string;
};

type GrupoRuta = {
  clave: string;
  tipo: Ruta["tipo"];
  distanciaMin: number;
  distanciaMax: number;
  desnivelMin: number;
  desnivelMax: number;
  rutas: Ruta[];
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

// Agrupa salidas de un mismo tipo (carretera/montaña) por distancia y
// desnivel parecidos — dos rutas cuentan como "la misma" si su distancia
// no difiere más de un 10% (mínimo 1 km) y su desnivel no difiere más de
// un 20% (mínimo 30 m) de la media del grupo. Aproximado a propósito
// (Antón lo pidió así): dos rutas distintas de tamaño parecido pueden
// acabar en el mismo grupo, pero es mucho más legible que una fila por
// cada salida suelta.
function agruparRutas(rutas: Ruta[]): GrupoRuta[] {
  const grupos: {
    tipo: Ruta["tipo"];
    sumaDistancia: number;
    sumaDesnivel: number;
    n: number;
    rutas: Ruta[];
  }[] = [];

  const ordenadas = [...rutas].sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));

  for (const r of ordenadas) {
    const distancia = r.distanciaKm ?? 0;
    const desnivel = r.desnivelM ?? 0;
    const tolDistancia = Math.max(1, distancia * 0.1);
    const tolDesnivel = Math.max(30, desnivel * 0.2);

    const grupo = grupos.find((g) => {
      if (g.tipo !== r.tipo) return false;
      const distanciaProm = g.sumaDistancia / g.n;
      const desnivelProm = g.sumaDesnivel / g.n;
      return (
        Math.abs(distancia - distanciaProm) <= tolDistancia &&
        Math.abs(desnivel - desnivelProm) <= tolDesnivel
      );
    });

    if (grupo) {
      grupo.sumaDistancia += distancia;
      grupo.sumaDesnivel += desnivel;
      grupo.n += 1;
      grupo.rutas.push(r);
    } else {
      grupos.push({ tipo: r.tipo, sumaDistancia: distancia, sumaDesnivel: desnivel, n: 1, rutas: [r] });
    }
  }

  return grupos
    .map((g, i) => {
      const distancias = g.rutas.map((r) => r.distanciaKm ?? 0);
      const desniveles = g.rutas.map((r) => r.desnivelM ?? 0);
      return {
        clave: `${g.tipo}-${i}`,
        tipo: g.tipo,
        distanciaMin: Math.min(...distancias),
        distanciaMax: Math.max(...distancias),
        desnivelMin: Math.min(...desniveles),
        desnivelMax: Math.max(...desniveles),
        rutas: g.rutas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
      };
    })
    .sort((a, b) => b.rutas.length - a.rutas.length || a.distanciaMin - b.distanciaMin);
}

export function RutasClient({ rutas, esDirector }: { rutas: Ruta[]; esDirector: boolean }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"todas" | "carretera" | "montana">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const q = sinAcentos(busqueda.trim().toLowerCase());
    return rutas.filter((r) => {
      if (tipo !== "todas" && r.tipo !== tipo) return false;
      if (q && !sinAcentos(r.nombre.toLowerCase()).includes(q)) return false;
      return true;
    });
  }, [rutas, tipo, busqueda]);

  const grupos = useMemo(() => agruparRutas(filtradas), [filtradas]);

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
        Salidas de ciclismo reales de quienes tienen Strava conectado, agrupadas por distancia y
        desnivel parecidos. {esDirector && "Pulsa \"Sincronizar rutas\" para traer las nuevas."}
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
        placeholder="Buscar por nombre de alguna salida…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-3.5"
      />

      {grupos.length === 0 ? (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">Aquí no hay nada todavía</b>
          {esDirector
            ? "Pulsa \"Sincronizar rutas\" para traer las salidas de quienes tienen Strava conectado."
            : "Pídele al director que sincronice rutas desde Strava."}
        </div>
      ) : (
        grupos.map((g) => {
          const abiertoAqui = abierto === g.clave;
          const rangoDistancia =
            g.distanciaMax - g.distanciaMin < 0.5
              ? `${g.distanciaMin.toFixed(1)} km`
              : `${g.distanciaMin.toFixed(1)}–${g.distanciaMax.toFixed(1)} km`;
          const rangoDesnivel =
            g.desnivelMax - g.desnivelMin < 20
              ? `${Math.round(g.desnivelMin)} m`
              : `${Math.round(g.desnivelMin)}–${Math.round(g.desnivelMax)} m`;
          return (
            <div key={g.clave} className="bg-surf border border-edge rounded-[10px] mb-2.5 overflow-hidden">
              <button
                onClick={() => setAbierto(abiertoAqui ? null : g.clave)}
                className="w-full flex items-center justify-between gap-2 text-left p-3.5 cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span
                      className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px]"
                      style={{ backgroundColor: `${COLOR_TIPO[g.tipo]}25`, color: COLOR_TIPO[g.tipo] }}
                    >
                      {LABEL_TIPO[g.tipo]}
                    </span>
                    <span className="text-xs text-mute">
                      {g.rutas.length} {g.rutas.length === 1 ? "salida" : "salidas"}
                    </span>
                  </div>
                  <b className="block text-[15px] font-medium truncate">
                    {rangoDistancia} · ▲ {rangoDesnivel}
                  </b>
                </div>
                <span className="text-mute text-xs shrink-0">{abiertoAqui ? "ocultar" : "ver"}</span>
              </button>

              {abiertoAqui && (
                <div className="border-t border-edge">
                  {g.rutas.map((r) => (
                    <a
                      key={r.id}
                      href={`https://www.strava.com/activities/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-3.5 py-2.5 border-b border-edge last:border-b-0"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-xs text-mute">{fmtFecha(r.fecha)}</span>
                        <span className="text-xs text-mute">· {r.deportista}</span>
                      </div>
                      <span className="block text-sm font-medium mb-0.5">{r.nombre}</span>
                      <div className="flex gap-4 text-xs text-mute">
                        {r.distanciaKm != null && <span>{r.distanciaKm.toFixed(1)} km</span>}
                        {r.desnivelM != null && <span>▲ {Math.round(r.desnivelM)} m</span>}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
