"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toISODateLocal } from "@/lib/date";

type TipoTest = {
  id: number;
  nombre: string;
  disciplina: string;
  distancia_m: number | null;
  metrica: "tiempo" | "potencia" | "distancia";
  mejor_es: "menor" | "mayor";
};

type Deportista = {
  id: number;
  ref: string | null;
  nombre: string;
  categoria: string | null;
  grupoIds: number[];
  grupoNombre: string | null;
};

type Grupo = { id: number; nombre: string };

type Resultado = {
  deportista_id: number;
  tiempo_s: number | null;
  distancia_m: number | null;
  potencia_w: number | null;
  fc_media: number | null;
  fc_max: number | null;
  fc_1min: number | null;
  rpe: number | null;
};

function fmtTiempo(s: number | null | undefined) {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const g = Math.round(s % 60);
  return `${m}'${String(g).padStart(2, "0")}"`;
}

function modoDe(test: TipoTest): "tiempo" | "pot" | "dist" {
  if (test.metrica === "potencia") return "pot";
  if (test.metrica === "distancia") return "dist";
  return "tiempo";
}

export function TestsClient({
  userId,
  tiposTest,
  deportistas,
  misGrupoIds,
  grupos,
}: {
  userId: string;
  tiposTest: TipoTest[];
  deportistas: Deportista[];
  misGrupoIds: number[];
  grupos: Grupo[];
}) {
  const [testId, setTestId] = useState<number | undefined>(tiposTest[0]?.id);
  const [fecha, setFecha] = useState(() => toISODateLocal(new Date()));
  const [resultados, setResultados] = useState<Record<number, Resultado>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);

  useEffect(() => {
    if (!testId) return;
    let cancelado = false;
    const supabase = createClient();
    supabase
      .from("resultados")
      .select(
        "deportista_id, tiempo_s, distancia_m, potencia_w, fc_media, fc_max, fc_1min, rpe",
      )
      .eq("tipo_test_id", testId)
      .eq("fecha", fecha)
      .then(({ data }) => {
        if (cancelado) return;
        const mapa: Record<number, Resultado> = {};
        (data ?? []).forEach((r) => {
          mapa[r.deportista_id] = r as Resultado;
        });
        setResultados(mapa);
      });
    return () => {
      cancelado = true;
    };
  }, [testId, fecha]);

  const test = tiposTest.find((t) => t.id === testId);
  const misGrupoSet = new Set(misGrupoIds);
  const misGruposNombres = grupos
    .filter((g) => misGrupoSet.has(g.id))
    .map((g) => g.nombre);

  const ordenados = [...deportistas]
    .sort((a, b) => {
      const mA = a.grupoIds.some((id) => misGrupoSet.has(id)) ? 0 : 1;
      const mB = b.grupoIds.some((id) => misGrupoSet.has(id)) ? 0 : 1;
      if (mA !== mB) return mA - mB;
      return (
        (a.grupoNombre ?? "").localeCompare(b.grupoNombre ?? "") ||
        a.nombre.localeCompare(b.nombre)
      );
    })
    .filter((d) => {
      if (soloPendientes && resultados[d.id]) return false;
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return (
        d.nombre.toLowerCase().includes(q) ||
        (d.grupoNombre ?? "").toLowerCase().includes(q)
      );
    });

  const hechos = Object.keys(resultados).length;

  function actualizarResultado(deportistaId: number, r: Resultado) {
    setResultados((prev) => ({ ...prev, [deportistaId]: r }));
    setEditing(null);
  }

  if (editing != null && test) {
    const deportista = deportistas.find((d) => d.id === editing)!;
    return (
      <EntradaView
        userId={userId}
        test={test}
        fecha={fecha}
        deportista={deportista}
        existente={resultados[editing] ?? null}
        onGuardado={(r) => actualizarResultado(editing, r)}
        onCancelar={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Registrar test
      </h2>
      <label
        htmlFor="test"
        className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]"
      >
        Prueba
      </label>
      <select
        id="test"
        value={testId}
        onChange={(e) => setTestId(Number(e.target.value))}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      >
        {tiposTest.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div>
          <label
            htmlFor="fecha"
            className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]"
          >
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
          />
        </div>
        <div>
          <span className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]">
            Registrados
          </span>
          <div className="bg-surf border border-edge rounded-[10px] px-[11px] py-[9px]">
            <b className="font-display text-[26px]">
              {hechos}
              <span className="text-mute text-[17px]"> / {deportistas.length}</span>
            </b>
          </div>
        </div>
      </div>

      <div className="lane my-4" />

      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        {misGruposNombres.length > 0
          ? `Esta semana llevas: ${misGruposNombres.join(" · ")}`
          : "Todos los deportistas"}
      </h2>

      <div className="flex gap-2 mb-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar deportista…"
          aria-label="Buscar deportista por nombre o grupo"
          className="flex-1 min-w-0 bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
        />
        <button
          onClick={() => setSoloPendientes((v) => !v)}
          aria-pressed={soloPendientes}
          className={`shrink-0 px-3.5 rounded-lg border font-display text-xs tracking-[.06em] uppercase cursor-pointer ${
            soloPendientes
              ? "bg-signal text-[#160800] border-signal font-semibold"
              : "bg-deep text-mute border-edge"
          }`}
        >
          Pendientes
        </button>
      </div>

      {ordenados.map((d, i) => {
        const r = resultados[d.id];
        const done = !!r;
        let valor: string | null = null;
        let ritmo: string | null = null;
        if (r && test) {
          if (test.metrica === "potencia") valor = `${r.potencia_w} W`;
          else if (test.metrica === "distancia") valor = `${r.distancia_m} m`;
          else valor = fmtTiempo(r.tiempo_s);

          if (test.metrica === "tiempo" && test.distancia_m && r.tiempo_s) {
            ritmo =
              test.disciplina === "natacion"
                ? `${fmtTiempo(r.tiempo_s / (test.distancia_m / 100))} /100`
                : `${fmtTiempo(r.tiempo_s / (test.distancia_m / 1000))} /km`;
          }
        }

        return (
          <div
            key={d.id}
            role="button"
            tabIndex={0}
            onClick={() => setEditing(d.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setEditing(d.id);
              }
            }}
            className={`relative overflow-hidden flex items-center gap-[11px] px-[13px] py-3 bg-surf border rounded-[10px] mb-[7px] cursor-pointer ${
              done ? "border-ok/40" : "border-edge"
            }`}
          >
            {done && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-ok" />}
            <span className="font-display text-[13px] text-mute min-w-[34px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 min-w-0">
              <b className="block text-[15px] font-medium truncate">{d.nombre}</b>
              <span className="text-xs text-mute">
                {d.categoria ?? "?"} · {d.grupoNombre ?? "Sin asignar"}
              </span>
            </span>
            {done ? (
              <span className="font-display text-[23px] font-semibold text-right">
                {valor}
                {ritmo && (
                  <small className="block text-xs text-mute font-normal tracking-[.06em] text-right">
                    {ritmo}
                  </small>
                )}
              </span>
            ) : (
              <span className="text-edge text-xl">+</span>
            )}
          </div>
        );
      })}
      {ordenados.length === 0 && (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          {deportistas.length === 0 ? (
            "Sin deportistas."
          ) : soloPendientes && !busqueda.trim() ? (
            <>
              <b className="block text-chalk text-base mb-[5px] font-medium">
                Ya están todos
              </b>
              No queda nadie por registrar en esta prueba.
            </>
          ) : (
            <>
              Ningún deportista coincide con la búsqueda.
              <button
                onClick={() => {
                  setBusqueda("");
                  setSoloPendientes(false);
                }}
                className="block mx-auto mt-2 text-signal underline"
              >
                Quitar filtros
              </button>
            </>
          )}
        </div>
      )}
      <p className="text-xs text-mute leading-relaxed mt-3.5 pt-3 border-t border-edge">
        Tus grupos de esta semana salen primero, pero puedes tomar la marca a
        cualquiera si cubres a un compañero.
      </p>
    </div>
  );
}

function EntradaView({
  userId,
  test,
  fecha,
  deportista,
  existente,
  onGuardado,
  onCancelar,
}: {
  userId: string;
  test: TipoTest;
  fecha: string;
  deportista: Deportista;
  existente: Resultado | null;
  onGuardado: (r: Resultado) => void;
  onCancelar: () => void;
}) {
  const modo = modoDe(test);
  const [buf, setBuf] = useState(() => {
    if (!existente) return "";
    if (modo === "pot") return existente.potencia_w != null ? String(existente.potencia_w) : "";
    if (modo === "dist") return existente.distancia_m != null ? String(existente.distancia_m) : "";
    if (existente.tiempo_s == null) return "";
    const m = Math.floor(existente.tiempo_s / 60);
    const s = Math.round(existente.tiempo_s % 60);
    return String(m).padStart(2, "0") + String(s).padStart(2, "0");
  });
  const [fcMedia, setFcMedia] = useState(existente?.fc_media?.toString() ?? "");
  const [fcMax, setFcMax] = useState(existente?.fc_max?.toString() ?? "");
  const [fc1, setFc1] = useState(existente?.fc_1min?.toString() ?? "");
  const [rpe, setRpe] = useState<number | null>(existente?.rpe ?? null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxLen = modo === "tiempo" ? 4 : 5;

  function pulsar(k: string) {
    if (k === "c") setBuf("");
    else if (k === "b") setBuf((b) => b.slice(0, -1));
    else setBuf((b) => (b + k).slice(0, maxLen));
  }

  const valorMostrado =
    modo === "tiempo"
      ? buf.padStart(4, "0").slice(-4).replace(/^(\d\d)(\d\d)$/, "$1:$2")
      : buf || "0";

  const etiqueta =
    modo === "pot" ? "Vatios medios" : modo === "dist" ? "Metros recorridos" : "Minutos : segundos";

  async function guardar() {
    if (!buf) {
      setError("Introduce la marca");
      return;
    }
    setGuardando(true);
    setError(null);

    const tiempo_s =
      modo === "tiempo"
        ? Number(buf.padStart(4, "0").slice(-4).slice(0, 2)) * 60 +
          Number(buf.padStart(4, "0").slice(-2))
        : null;
    const potencia_w = modo === "pot" ? Number(buf) : null;
    const distancia_m = modo === "dist" ? Number(buf) : null;

    const registro = {
      fecha,
      tipo_test_id: test.id,
      deportista_id: deportista.id,
      registrado_por: userId,
      tiempo_s,
      distancia_m,
      potencia_w,
      fc_media: fcMedia ? Number(fcMedia) : null,
      fc_max: fcMax ? Number(fcMax) : null,
      fc_1min: fc1 ? Number(fc1) : null,
      rpe,
    };

    const supabase = createClient();
    const { error } = await supabase
      .from("resultados")
      .upsert(registro, { onConflict: "fecha,tipo_test_id,deportista_id" });

    setGuardando(false);
    if (error) {
      setError(
        error.code === "42501"
          ? "No se puede registrar: esta fecha tiene más de 7 días y ya no se puede tocar. Pídeselo al director técnico."
          : error.message,
      );
      return;
    }
    onGuardado({
      deportista_id: deportista.id,
      tiempo_s,
      distancia_m,
      potencia_w,
      fc_media: registro.fc_media,
      fc_max: registro.fc_max,
      fc_1min: registro.fc_1min,
      rpe,
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5 text-sm text-mute">
        <span className="font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] bg-edge">
          {test.nombre}
        </span>
        <span>{fecha.split("-").reverse().slice(0, 2).join("/")}</span>
      </div>
      <h3 className="text-[20px] font-semibold mb-3.5">{deportista.nombre}</h3>

      <div className="bg-[#04141C] border border-edge rounded-[10px] pt-[18px] pb-4 px-3.5 text-center mb-1.5">
        <div className="font-display text-[62px] leading-[.92] font-semibold text-signal">
          {valorMostrado}
        </div>
        <div className="font-display text-xs tracking-[.2em] uppercase text-mute mt-[7px]">
          {etiqueta}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[7px] mt-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <button
            key={k}
            onClick={() => pulsar(k)}
            className="bg-surf border border-edge text-chalk rounded-[9px] py-[15px] font-display text-2xl cursor-pointer"
          >
            {k}
          </button>
        ))}
        <button
          onClick={() => pulsar("c")}
          className="bg-surf border border-edge text-mute rounded-[9px] py-[15px] font-display text-sm tracking-[.08em] uppercase cursor-pointer"
        >
          Borrar
        </button>
        <button
          onClick={() => pulsar("0")}
          className="bg-surf border border-edge text-chalk rounded-[9px] py-[15px] font-display text-2xl cursor-pointer"
        >
          0
        </button>
        <button
          onClick={() => pulsar("b")}
          className="bg-surf border border-edge text-mute rounded-[9px] py-[15px] font-display text-sm tracking-[.08em] uppercase cursor-pointer"
        >
          ←
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <div>
          <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]">
            FC media
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={fcMedia}
            onChange={(e) => setFcMedia(e.target.value)}
            placeholder="—"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
          />
        </div>
        <div>
          <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]">
            FC máx
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={fcMax}
            onChange={(e) => setFcMax(e.target.value)}
            placeholder="—"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
          />
        </div>
        <div>
          <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]">
            FC a 1&apos;
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={fc1}
            onChange={(e) => setFc1(e.target.value)}
            placeholder="—"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
          />
        </div>
      </div>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]">
        Percepción del esfuerzo
      </label>
      {/* 6 por fila: cada botón queda por encima de los 44px que hace falta
          para acertar con el dedo mojado, sin desbordar en móvil. */}
      <div className="grid grid-cols-6 gap-[7px] mt-[5px]">
        {Array.from({ length: 11 }, (_, n) => n).map((n) => (
          <button
            key={n}
            onClick={() => setRpe(n)}
            aria-pressed={rpe === n}
            className={`min-h-[44px] rounded-full border text-[15px] cursor-pointer ${
              rpe === n
                ? "bg-signal text-[#160800] border-signal font-semibold"
                : "bg-deep text-mute border-edge"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {error && <p className="text-run text-sm mt-3">{error}</p>}

      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer mt-4 disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar marca"}
      </button>
      <button
        onClick={onCancelar}
        className="w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase cursor-pointer mt-2"
      >
        Volver sin guardar
      </button>
    </div>
  );
}
