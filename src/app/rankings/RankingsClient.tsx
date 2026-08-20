"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmtTiempo, fmtFecha } from "@/lib/formato";

type TipoTest = {
  id: number;
  nombre: string;
  disciplina: string;
  metrica: "tiempo" | "potencia" | "distancia";
  mejor_es: "menor" | "mayor";
};

type Marca = {
  deportista_id: number;
  deportista: string;
  categoria: string | null;
  grupos: string | null;
  tipo_test_id: number;
  test: string;
  disciplina: string;
  metrica: "tiempo" | "potencia" | "distancia";
  mejor_es: "menor" | "mayor";
  tiempo_s: number | null;
  distancia_m: number | null;
  potencia_w: number | null;
  fecha: string;
};

const COLOR_DISC: Record<string, string> = {
  natacion: "#43C6E0",
  ciclismo: "#A8D84A",
  carrera: "#FF9145",
};
const COLOR_DEFECTO = "#FF6A2B";

function valorDe(m: Marca) {
  if (m.metrica === "potencia") return m.potencia_w;
  if (m.metrica === "distancia") return m.distancia_m;
  return m.tiempo_s;
}

function formatValor(m: Marca) {
  const v = valorDe(m);
  if (v == null) return "—";
  if (m.metrica === "potencia") return `${v} W`;
  if (m.metrica === "distancia") return `${v} m`;
  return fmtTiempo(v);
}

const MEDALLA: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Genera una imagen cuadrada (1080x1080, formato Instagram) con el ranking
// actual, para descargar y subir a redes — no publica nada solo, el
// director decide si la sube y cuándo.
async function generarImagenRanking(
  test: TipoTest,
  filas: Marca[],
  categoria: string,
  anio: number,
  color: string,
) {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#071c26";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, 16);

  const logo = new Image();
  logo.src = "/logo-club.png";
  await new Promise((resolve) => {
    logo.onload = resolve;
    logo.onerror = resolve;
  });
  if (logo.complete && logo.naturalWidth > 0) {
    ctx.drawImage(logo, size / 2 - 55, 70, 110, 110);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#7fa5b0";
  ctx.font = "700 26px Arial";
  ctx.fillText("C.D.E. TRIATLÓN ALPEDRETE", size / 2, 225);

  ctx.fillStyle = "#eaf4f6";
  ctx.font = "800 50px Arial";
  ctx.fillText(test.nombre.toUpperCase(), size / 2, 285);

  ctx.fillStyle = color;
  ctx.font = "700 30px Arial";
  ctx.fillText(categoria === "todas" ? `Temporada ${anio}` : `${categoria} · ${anio}`, size / 2, 330);

  const top = filas.slice(0, 8);
  let y = 430;
  const rowH = 78;
  top.forEach((m, i) => {
    const medalla = MEDALLA[i + 1] ?? `${i + 1}.`;
    ctx.textAlign = "left";
    ctx.fillStyle = "#eaf4f6";
    ctx.font = "700 36px Arial";
    ctx.fillText(`${medalla}  ${m.deportista}`, 90, y);
    ctx.textAlign = "right";
    ctx.fillStyle = color;
    ctx.font = "800 38px Arial";
    ctx.fillText(formatValor(m), size - 90, y);
    y += rowH;
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#7fa5b0";
  ctx.font = "500 22px Arial";
  ctx.fillText(
    test.mejor_es === "menor" ? "Más bajo es mejor" : "Más alto es mejor",
    size / 2,
    size - 50,
  );

  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ranking-${test.nombre.replace(/\s+/g, "-")}-${anio}.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

export function RankingsClient({
  tiposTest,
  marcasIniciales,
  anioInicial,
  error,
}: {
  tiposTest: TipoTest[];
  marcasIniciales: Marca[];
  anioInicial: number;
  error: string | null;
}) {
  const [testId, setTestId] = useState<number | undefined>(tiposTest[0]?.id);
  const [anio, setAnio] = useState(anioInicial);
  const [categoria, setCategoria] = useState<string>("todas");
  const [marcas, setMarcas] = useState<Marca[]>(marcasIniciales);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(error);
  const [generandoImagen, setGenerandoImagen] = useState(false);

  useEffect(() => {
    if (anio === anioInicial) {
      setMarcas(marcasIniciales);
      setErrorCarga(error);
      return;
    }
    let cancelado = false;
    setCargando(true);
    const supabase = createClient();
    supabase
      .rpc("mejores_marcas", { p_anio: anio })
      .then(({ data, error }) => {
        if (cancelado) return;
        setMarcas((data ?? []) as Marca[]);
        setErrorCarga(error?.message ?? null);
        setCargando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio]);

  const test = tiposTest.find((t) => t.id === testId);

  const marcasDelTest = useMemo(
    () => marcas.filter((m) => m.tipo_test_id === testId),
    [marcas, testId],
  );

  const categorias = useMemo(() => {
    const set = new Set<string>();
    marcasDelTest.forEach((m) => set.add(m.categoria ?? "Sin categoría"));
    return [...set].sort();
  }, [marcasDelTest]);

  const filas = useMemo(() => {
    if (!test) return [];
    const filtradas =
      categoria === "todas"
        ? marcasDelTest
        : marcasDelTest.filter((m) => (m.categoria ?? "Sin categoría") === categoria);
    return [...filtradas].sort((a, b) => {
      const va = valorDe(a);
      const vb = valorDe(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      return test.mejor_es === "menor" ? va - vb : vb - va;
    });
  }, [marcasDelTest, categoria, test]);

  const color = test ? (COLOR_DISC[test.disciplina] ?? COLOR_DEFECTO) : COLOR_DEFECTO;
  const anios = [anioInicial, anioInicial - 1, anioInicial - 2];

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Rankings del club
      </h2>
      <p className="text-xs text-mute mb-3.5">
        La mejor marca de cada deportista en la temporada, por prueba y categoría.
      </p>

      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        <select
          value={testId}
          onChange={(e) => setTestId(Number(e.target.value))}
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
        >
          {tiposTest.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <select
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
        >
          {anios.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {categorias.length > 1 && (
        <div className="flex gap-1.5 mb-3.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoria("todas")}
            className={`shrink-0 px-3 py-1.5 rounded-full border font-display text-xs tracking-[.06em] uppercase cursor-pointer ${
              categoria === "todas"
                ? "bg-signal text-[#160800] border-signal font-semibold"
                : "bg-deep text-mute border-edge"
            }`}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full border font-display text-xs tracking-[.06em] uppercase cursor-pointer ${
                categoria === c
                  ? "bg-signal text-[#160800] border-signal font-semibold"
                  : "bg-deep text-mute border-edge"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {test && (
        <p className="text-xs text-mute mb-3.5">
          {test.mejor_es === "menor" ? "Más bajo es mejor" : "Más alto es mejor"}
        </p>
      )}

      {test && filas.length > 0 && (
        <button
          onClick={async () => {
            setGenerandoImagen(true);
            await generarImagenRanking(test, filas, categoria, anio, color);
            setGenerandoImagen(false);
          }}
          disabled={generandoImagen}
          className="w-full bg-transparent border border-edge text-chalk rounded-[9px] py-2.5 font-display text-xs tracking-[.08em] uppercase cursor-pointer mb-3.5 disabled:opacity-60"
        >
          {generandoImagen ? "Generando…" : "📸 Descargar imagen para Instagram"}
        </button>
      )}

      {errorCarga ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el ranking
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de rankings en Supabase.
            Detalle técnico: {errorCarga}
          </p>
        </div>
      ) : cargando ? (
        <p className="text-mute text-sm py-6 text-center">Cargando…</p>
      ) : filas.length === 0 ? (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">
            Sin marcas todavía
          </b>
          Cuando alguien registre esta prueba en {anio}, aparecerá aquí el ranking.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <Th></Th>
                <Th>Deportista</Th>
                <Th>Categoría</Th>
                <Th>Marca</Th>
                <Th>Fecha</Th>
              </tr>
            </thead>
            <tbody>
              {filas.map((m, i) => (
                <tr key={m.deportista_id}>
                  <Td className="font-display text-mute w-8">
                    {MEDALLA[i + 1] ?? i + 1}
                  </Td>
                  <Td>
                    <b className="font-medium">{m.deportista}</b>
                    <span className="block text-xs text-mute">
                      {m.grupos ?? "Sin grupo"}
                    </span>
                  </Td>
                  <Td className="text-mute">{m.categoria ?? "—"}</Td>
                  <Td className="font-display" style={{ color }}>
                    {formatValor(m)}
                  </Td>
                  <Td className="text-mute">{fmtFecha(m.fecha)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="text-left font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td className={`py-[9px] px-1.5 border-b border-edge/50 ${className}`} style={style}>
      {children}
    </td>
  );
}
