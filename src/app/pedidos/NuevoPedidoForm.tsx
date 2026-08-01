"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { crearPedido } from "./actions";
import { TALLAS_INFANTIL, TALLAS_ADULTO } from "./tallas";

type Deportista = { id: number; nombre: string; categoria: string | null };

export function NuevoPedidoForm({ deportistas }: { deportistas: Deportista[] }) {
  const router = useRouter();
  const [deportistaId, setDeportistaId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [articulo, setArticulo] = useState<"camiseta" | "sudadera">("camiseta");
  const [talla, setTalla] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return deportistas;
    return deportistas.filter((d) => d.nombre.toLowerCase().includes(q));
  }, [deportistas, busqueda]);

  const deportista = deportistas.find((d) => d.id === deportistaId) ?? null;

  if (!deportista) {
    return (
      <div>
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
          Nuevo pedido
        </h2>
        <p className="text-sm text-mute mb-3">¿Para quién es el pedido?</p>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar deportista…"
          aria-label="Buscar deportista"
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px] mb-3"
        />
        {filtrados.map((d) => (
          <button
            key={d.id}
            onClick={() => setDeportistaId(d.id)}
            className="w-full text-left flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3.5 mb-2 cursor-pointer"
          >
            <span className="min-w-0">
              <b className="block text-[15px] font-medium truncate">{d.nombre}</b>
              {d.categoria && <span className="text-xs text-mute">{d.categoria}</span>}
            </span>
            <span className="shrink-0 text-edge text-xl">+</span>
          </button>
        ))}
        {filtrados.length === 0 && (
          <p className="text-mute text-sm text-center py-6">Sin resultados.</p>
        )}
      </div>
    );
  }

  async function emitir() {
    setError(null);
    if (!talla) {
      setError("Elige una talla");
      return;
    }
    const cantidadNum = Number(cantidad);
    if (!(cantidadNum > 0)) {
      setError("La cantidad tiene que ser mayor que cero");
      return;
    }
    setEnviando(true);
    const resultado = await crearPedido({
      deportistaId: deportista!.id,
      articulo,
      talla,
      cantidad: cantidadNum,
    });
    if ("error" in resultado) {
      setError(resultado.error);
      setEnviando(false);
      return;
    }
    router.push("/pedidos");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Nuevo pedido
        </h2>
        <button
          onClick={() => {
            setDeportistaId(null);
            setError(null);
          }}
          className="font-display text-xs tracking-[.08em] uppercase text-signal"
        >
          Cambiar
        </button>
      </div>
      <h3 className="text-[20px] font-semibold mb-3.5">{deportista.nombre}</h3>

      <label className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]">
        Artículo
      </label>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {(["camiseta", "sudadera"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setArticulo(a)}
            aria-pressed={articulo === a}
            className={`min-h-[44px] rounded-lg border font-display text-sm tracking-[.06em] uppercase cursor-pointer ${
              articulo === a
                ? "bg-signal text-[#160800] border-signal font-semibold"
                : "bg-deep text-chalk border-edge"
            }`}
          >
            {a === "camiseta" ? "Camiseta" : "Sudadera"}
          </button>
        ))}
      </div>

      <label
        htmlFor="talla"
        className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]"
      >
        Talla
      </label>
      <select
        id="talla"
        value={talla}
        onChange={(e) => setTalla(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px] mb-3"
      >
        <option value="">Elige una talla…</option>
        <optgroup label="Infantil">
          {TALLAS_INFANTIL.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </optgroup>
        <optgroup label="Adulto">
          {TALLAS_ADULTO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </optgroup>
      </select>

      <label
        htmlFor="cantidad"
        className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]"
      >
        Cantidad
      </label>
      <input
        id="cantidad"
        type="number"
        inputMode="numeric"
        min={1}
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px]"
      />

      {error && <p className="text-run text-sm mt-3">{error}</p>}

      <button
        onClick={emitir}
        disabled={enviando}
        className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer mt-4 disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar pedido"}
      </button>
    </div>
  );
}
