"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { fmtTiempo, fmtFecha } from "@/lib/formato";

type Deportista = {
  id: number;
  nombre: string;
  ref: string | null;
  categoria: string | null;
  grupo_id: number | null;
};
type TipoTest = {
  id: number;
  nombre: string;
  disciplina: string;
  metrica: "tiempo" | "potencia" | "distancia";
  mejor_es: "menor" | "mayor";
  distancia_m: number | null;
};
type Grupo = { id: number; nombre: string };

type FilaCalc = {
  fecha: string;
  deportista: string;
  deportista_id: number;
  tiempo_s: number | null;
  distancia_m: number | null;
  potencia_w: number | null;
  fc_media: number | null;
  rpe: number | null;
  ritmo_s: number | null;
  disciplina: string;
};

const COLOR_DISC: Record<string, string> = {
  natacion: "#43C6E0",
  ciclismo: "#A8D84A",
  carrera: "#FF9145",
};
const COLOR_DEFECTO = "#FF6A2B";

function valorDe(r: { tiempo_s: number | null; distancia_m: number | null; potencia_w: number | null }, metrica: TipoTest["metrica"]) {
  if (metrica === "potencia") return r.potencia_w;
  if (metrica === "distancia") return r.distancia_m;
  return r.tiempo_s;
}

function formatValor(valor: number | null, metrica: TipoTest["metrica"]) {
  if (valor == null) return "—";
  if (metrica === "potencia") return `${valor} W`;
  if (metrica === "distancia") return `${valor} m`;
  return fmtTiempo(valor);
}

function CustomTooltip({
  active,
  payload,
  metrica,
  unidad,
}: {
  active?: boolean;
  payload?: { payload: { fechaLabel: string; valor: number; nombre?: string } }[];
  metrica: TipoTest["metrica"];
  unidad: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-surf border border-edge rounded-lg px-3 py-2 text-xs">
      {p.nombre && <div className="text-chalk font-medium mb-0.5">{p.nombre}</div>}
      <div className="text-mute">{p.fechaLabel}</div>
      <div className="text-chalk font-semibold text-sm">
        {formatValor(p.valor, metrica)}
        {unidad && <span className="text-mute font-normal"> {unidad}</span>}
      </div>
    </div>
  );
}

export function AnalisisClient({
  deportistas,
  tiposTest,
  grupos,
}: {
  deportistas: Deportista[];
  tiposTest: TipoTest[];
  grupos: Grupo[];
}) {
  const [tab, setTab] = useState<"deportista" | "grupo">("deportista");

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Análisis
      </h2>
      <div className="flex bg-surf border border-edge rounded-[9px] p-1 mb-4">
        {(["deportista", "grupo"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg font-display text-xs tracking-[.08em] uppercase cursor-pointer ${
              tab === t ? "bg-signal text-[#160800] font-semibold" : "text-mute"
            }`}
          >
            {t === "deportista" ? "Ficha individual" : "Comparativa de grupo"}
          </button>
        ))}
      </div>

      {tab === "deportista" ? (
        <FichaIndividual deportistas={deportistas} tiposTest={tiposTest} />
      ) : (
        <ComparativaGrupo grupos={grupos} tiposTest={tiposTest} />
      )}
    </div>
  );
}

function FichaIndividual({
  deportistas,
  tiposTest,
}: {
  deportistas: Deportista[];
  tiposTest: TipoTest[];
}) {
  const [deportistaId, setDeportistaId] = useState<number | undefined>(deportistas[0]?.id);
  const [testId, setTestId] = useState<number | undefined>(tiposTest[0]?.id);
  const [filas, setFilas] = useState<FilaCalc[]>([]);
  const [filasKey, setFilasKey] = useState<string | null>(null);

  const test = tiposTest.find((t) => t.id === testId);
  const clave = deportistaId && testId ? `${deportistaId}:${testId}` : null;
  const cargando = clave !== null && clave !== filasKey;

  useEffect(() => {
    if (!deportistaId || !testId) return;
    const clave = `${deportistaId}:${testId}`;
    const supabase = createClient();
    supabase
      .from("resultados_calc")
      .select("fecha, tiempo_s, distancia_m, potencia_w, fc_media, rpe, ritmo_s, disciplina, deportista, deportista_id")
      .eq("deportista_id", deportistaId)
      .eq("tipo_test_id", testId)
      .order("fecha", { ascending: true })
      .then(({ data }) => {
        setFilas((data ?? []) as FilaCalc[]);
        setFilasKey(clave);
      });
  }, [deportistaId, testId]);

  const datosGrafico = useMemo(() => {
    if (!test) return [];
    return filas
      .map((f) => ({
        fechaLabel: fmtFecha(f.fecha),
        valor: valorDe(f, test.metrica),
      }))
      .filter((d) => d.valor != null) as { fechaLabel: string; valor: number }[];
  }, [filas, test]);

  // Lo que de verdad quiere saber un director: dónde está su mejor marca,
  // cuál es la última, y si va mejorando o empeorando.
  const resumen = useMemo(() => {
    if (!test || datosGrafico.length === 0) return null;
    const valores = datosGrafico.map((d) => d.valor);
    const mejor = test.mejor_es === "menor" ? Math.min(...valores) : Math.max(...valores);
    const ultima = valores[valores.length - 1];
    const primera = valores[0];
    const diferencia = ultima - primera;
    // "Mejora" no es siempre subir: en tiempos, bajar es mejorar.
    const mejora = test.mejor_es === "menor" ? -diferencia : diferencia;
    return {
      mejor,
      ultima,
      esRecord: ultima === mejor,
      mejora,
      hayComparacion: datosGrafico.length > 1,
      marcas: datosGrafico.length,
    };
  }, [datosGrafico, test]);

  const color = test ? (COLOR_DISC[test.disciplina] ?? COLOR_DEFECTO) : COLOR_DEFECTO;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 mb-1">
        <select
          value={deportistaId}
          onChange={(e) => setDeportistaId(Number(e.target.value))}
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
        >
          {deportistas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
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
      </div>
      {test && (
        <p className="text-xs text-mute mb-3.5">
          {test.mejor_es === "menor" ? "Más bajo es mejor" : "Más alto es mejor"}
        </p>
      )}

      {cargando ? (
        <p className="text-mute text-sm py-6 text-center">Cargando…</p>
      ) : datosGrafico.length === 0 ? (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">Sin marcas todavía</b>
          Cuando este deportista tenga resultados de esta prueba, aparecerá aquí
          la evolución.
        </div>
      ) : (
        <>
          {resumen && test && (
            <div className="grid grid-cols-3 gap-2 mb-3.5">
              <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
                <span className="text-[11px] text-mute tracking-[.04em] block mb-0.5">
                  MEJOR MARCA
                </span>
                <b className="font-display text-[22px] block leading-none">
                  {formatValor(resumen.mejor, test.metrica)}
                </b>
              </div>
              <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
                <span className="text-[11px] text-mute tracking-[.04em] block mb-0.5">
                  ÚLTIMA
                </span>
                <b className="font-display text-[22px] block leading-none">
                  {formatValor(resumen.ultima, test.metrica)}
                </b>
                {resumen.esRecord && resumen.hayComparacion && (
                  <span className="text-[11px] text-ok">es su mejor marca</span>
                )}
              </div>
              <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
                <span className="text-[11px] text-mute tracking-[.04em] block mb-0.5">
                  DESDE LA 1ª
                </span>
                {resumen.hayComparacion ? (
                  <b
                    className={`font-display text-[22px] block leading-none ${
                      resumen.mejora > 0 ? "text-ok" : resumen.mejora < 0 ? "text-run" : ""
                    }`}
                  >
                    {resumen.mejora > 0 ? "▲" : resumen.mejora < 0 ? "▼" : "="}{" "}
                    {formatValor(Math.abs(resumen.ultima - datosGrafico[0].valor), test.metrica)}
                  </b>
                ) : (
                  <b className="font-display text-[22px] block leading-none text-mute">—</b>
                )}
                <span className="text-[11px] text-mute">
                  {resumen.marcas} {resumen.marcas === 1 ? "marca" : "marcas"}
                </span>
              </div>
            </div>
          )}

          <div style={{ width: "100%", height: 220 }} className="mb-3.5">
            <ResponsiveContainer>
              <LineChart data={datosGrafico} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1B4C60" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="fechaLabel"
                  tick={{ fill: "#7FA5B0", fontSize: 11 }}
                  axisLine={{ stroke: "#1B4C60" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#7FA5B0", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) => (test?.metrica === "tiempo" ? fmtTiempo(v) : String(v))}
                  domain={["dataMin", "dataMax"]}
                />
                <Tooltip content={<CustomTooltip metrica={test!.metrica} unidad="" />} />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, fill: color, strokeWidth: 2, stroke: "#0E2E3D" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Marca</Th>
                  <Th>FC media</Th>
                  <Th>RPE</Th>
                </tr>
              </thead>
              <tbody>
                {[...filas].reverse().map((f, i) => (
                  <tr key={i}>
                    <Td className="font-display">{fmtFecha(f.fecha)}</Td>
                    <Td>{formatValor(valorDe(f, test!.metrica), test!.metrica)}</Td>
                    <Td className="text-mute">{f.fc_media ?? "—"}</Td>
                    <Td className="text-mute">{f.rpe ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ComparativaGrupo({ grupos, tiposTest }: { grupos: Grupo[]; tiposTest: TipoTest[] }) {
  const [grupoId, setGrupoId] = useState<number | undefined>(grupos[0]?.id);
  const [testId, setTestId] = useState<number | undefined>(tiposTest[0]?.id);
  const [filas, setFilas] = useState<FilaCalc[]>([]);
  const [filasKey, setFilasKey] = useState<string | null>(null);

  const test = tiposTest.find((t) => t.id === testId);
  const clave = grupoId && testId ? `${grupoId}:${testId}` : null;
  const cargando = clave !== null && clave !== filasKey;

  useEffect(() => {
    if (!grupoId || !testId) return;
    const clave = `${grupoId}:${testId}`;
    const supabase = createClient();
    supabase
      .from("resultados_calc")
      .select(
        "fecha, tiempo_s, distancia_m, potencia_w, fc_media, rpe, ritmo_s, disciplina, deportista, deportista_id, grupo_id",
      )
      .eq("grupo_id", grupoId)
      .eq("tipo_test_id", testId)
      .order("fecha", { ascending: false })
      .then(({ data }) => {
        setFilas((data ?? []) as FilaCalc[]);
        setFilasKey(clave);
      });
  }, [grupoId, testId]);

  const datos = useMemo(() => {
    if (!test) return [];
    const vistos = new Set<number>();
    const ultimos: { nombre: string; valor: number; fecha: string }[] = [];
    for (const f of filas) {
      if (vistos.has(f.deportista_id)) continue;
      const valor = valorDe(f, test.metrica);
      if (valor == null) continue;
      vistos.add(f.deportista_id);
      ultimos.push({ nombre: f.deportista, valor, fecha: f.fecha });
    }
    ultimos.sort((a, b) => (test.mejor_es === "menor" ? a.valor - b.valor : b.valor - a.valor));
    return ultimos;
  }, [filas, test]);

  const color = test ? (COLOR_DISC[test.disciplina] ?? COLOR_DEFECTO) : COLOR_DEFECTO;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 mb-1">
        <select
          value={grupoId}
          onChange={(e) => setGrupoId(Number(e.target.value))}
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
        >
          {grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </select>
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
      </div>
      {test && (
        <p className="text-xs text-mute mb-3.5">
          Última marca de cada deportista · {test.mejor_es === "menor" ? "más bajo es mejor" : "más alto es mejor"}
        </p>
      )}

      {cargando ? (
        <p className="text-mute text-sm py-6 text-center">Cargando…</p>
      ) : datos.length === 0 ? (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">Sin marcas todavía</b>
          Cuando el grupo tenga resultados de esta prueba, aparecerá aquí la
          comparativa.
        </div>
      ) : (
        <>
          <div style={{ width: "100%", height: Math.max(160, datos.length * 34) }} className="mb-3.5">
            <ResponsiveContainer>
              <BarChart
                data={datos}
                layout="vertical"
                margin={{ top: 4, right: 44, left: 0, bottom: 4 }}
              >
                <CartesianGrid stroke="#1B4C60" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#7FA5B0", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (test?.metrica === "tiempo" ? fmtTiempo(v) : String(v))}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  tick={{ fill: "#EAF4F6", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<CustomTooltip metrica={test!.metrica} unidad="" />} />
                <Bar dataKey="valor" fill={color} radius={4} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <Th>Deportista</Th>
                  <Th>Marca</Th>
                  <Th>Fecha</Th>
                </tr>
              </thead>
              <tbody>
                {datos.map((d, i) => (
                  <tr key={i}>
                    <Td>{d.nombre}</Td>
                    <Td className="font-display">{formatValor(d.valor, test!.metrica)}</Td>
                    <Td className="text-mute">{fmtFecha(d.fecha)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-[9px] px-1.5 border-b border-edge/50 ${className}`}>{children}</td>;
}
