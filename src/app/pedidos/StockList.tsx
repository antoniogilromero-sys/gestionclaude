"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearStock, actualizarCantidadStock, borrarStock } from "./actions";
import { TALLAS_INFANTIL, TALLAS_ADULTO } from "./tallas";

type Item = {
  id: number;
  tipo: "algodon" | "tecnica";
  genero: "hombre" | "mujer" | "unisex";
  talla: string;
  cantidad: number;
  notas: string | null;
};

const LABEL_TIPO: Record<Item["tipo"], string> = {
  algodon: "Camisetas de algodón",
  tecnica: "Camisetas técnicas",
};
const LABEL_GENERO: Record<Item["genero"], string> = {
  hombre: "Hombre",
  mujer: "Mujer",
  unisex: "Unisex",
};
const TALLAS = [...TALLAS_INFANTIL, ...TALLAS_ADULTO];

export function StockList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [tipo, setTipo] = useState<Item["tipo"]>("algodon");
  const [genero, setGenero] = useState<Item["genero"]>("unisex");
  const [talla, setTalla] = useState(TALLAS[0]);
  const [cantidad, setCantidad] = useState("1");
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onAlta() {
    setError(null);
    setEnviando(true);
    const resultado = await crearStock({
      tipo,
      genero,
      talla,
      cantidad: Number(cantidad) || 0,
      notas,
    });
    setEnviando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    setNotas("");
    setCantidad("1");
    setMostrarAlta(false);
    router.refresh();
  }

  async function onCambiarCantidad(id: number, nueva: number) {
    if (nueva < 0) return;
    setCargando(id);
    setError(null);
    const resultado = await actualizarCantidadStock(id, nueva);
    setCargando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  async function onBorrar(id: number) {
    setCargando(id);
    setError(null);
    const resultado = await borrarStock(id);
    setCargando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  const grupos: Record<Item["tipo"], Item[]> = { algodon: [], tecnica: [] };
  for (const it of items) grupos[it.tipo].push(it);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Stock de camisetas
        </h2>
        <button
          onClick={() => setMostrarAlta((v) => !v)}
          className="font-display text-xs tracking-[.08em] uppercase text-signal cursor-pointer"
        >
          {mostrarAlta ? "Cancelar" : "+ Añadir"}
        </button>
      </div>

      {error && <p className="text-run text-sm mb-2.5">{error}</p>}

      {mostrarAlta && (
        <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3.5">
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Item["tipo"])}
              className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
            >
              <option value="algodon">Algodón</option>
              <option value="tecnica">Técnica</option>
            </select>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value as Item["genero"])}
              className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
            >
              <option value="unisex">Unisex</option>
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <select
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
            >
              {TALLAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cantidad"
              className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
            />
          </div>
          <input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Nota (opcional)"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-3"
          />
          <button
            onClick={onAlta}
            disabled={enviando}
            className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
          >
            {enviando ? "Guardando…" : "Añadir al stock"}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-mute text-sm text-center py-6">Todavía no hay nada en el stock.</p>
      ) : (
        (["algodon", "tecnica"] as const).map((t) =>
          grupos[t].length === 0 ? null : (
            <div key={t} className="mb-3">
              <span className="font-display text-[11px] tracking-[.08em] uppercase text-mute block mb-1.5">
                {LABEL_TIPO[t]}
              </span>
              {grupos[t].map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3 mb-2"
                >
                  <div className="min-w-0">
                    <b className="block text-[15px] font-medium">
                      {LABEL_GENERO[it.genero]} · talla {it.talla}
                    </b>
                    {it.notas && <span className="text-xs text-mute">{it.notas}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onCambiarCantidad(it.id, it.cantidad - 1)}
                      disabled={cargando === it.id || it.cantidad === 0}
                      className="min-w-[36px] min-h-[36px] rounded-lg border border-edge text-chalk font-display text-base cursor-pointer disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="min-w-[28px] text-center font-display text-[15px] num">
                      {it.cantidad}
                    </span>
                    <button
                      onClick={() => onCambiarCantidad(it.id, it.cantidad + 1)}
                      disabled={cargando === it.id}
                      className="min-w-[36px] min-h-[36px] rounded-lg border border-edge text-chalk font-display text-base cursor-pointer disabled:opacity-40"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onBorrar(it.id)}
                      disabled={cargando === it.id}
                      className="text-mute text-xs underline ml-1"
                    >
                      borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ),
        )
      )}
    </div>
  );
}
