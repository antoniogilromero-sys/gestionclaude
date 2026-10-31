"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearPrueba, borrarPrueba } from "./actions";

type Prueba = {
  id: number;
  nombre: string;
  fecha: string | null;
  lugar: string | null;
  equipos: number;
  nadadores: number;
};

export function PruebasList({ pruebas }: { pruebas: Prueba[] }) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [lugar, setLugar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);

  async function crear() {
    setError(null);
    if (!nombre.trim()) {
      setError("Falta el nombre de la prueba");
      return;
    }
    setEnviando(true);
    const resultado = await crearPrueba({ nombre, fecha, lugar });
    setEnviando(false);
    if ("error" in resultado) {
      setError(resultado.error);
      return;
    }
    router.push(`/equipos-prueba/${resultado.id}`);
    router.refresh();
  }

  async function borrar(id: number) {
    setError(null);
    const resultado = await borrarPrueba(id);
    if ("error" in resultado) setError(resultado.error);
    else {
      setConfirmando(null);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Equipos de prueba
        </h2>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="font-display text-xs tracking-[.08em] uppercase text-signal cursor-pointer"
        >
          {mostrarForm ? "Cancelar" : "+ Nueva"}
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-4">
          <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
            Nombre de la prueba
          </label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="100x100 Villanueva de la Cañada 2026"
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm mb-2.5"
          />
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div>
              <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
                Fecha (opcional)
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
                Lugar (opcional)
              </label>
              <input
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-run text-sm mb-2">{error}</p>}
          <button
            onClick={crear}
            disabled={enviando}
            className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer disabled:opacity-60"
          >
            {enviando ? "Creando…" : "Crear con 2 equipos"}
          </button>
        </div>
      )}

      {!mostrarForm && error && <p className="text-run text-sm mb-3">{error}</p>}

      {pruebas.length === 0 ? (
        <p className="text-mute text-sm text-center py-6">
          Todavía no hay ninguna prueba. Crea la primera con &quot;+ Nueva&quot;.
        </p>
      ) : (
        pruebas.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
          >
            <Link href={`/equipos-prueba/${p.id}`} className="min-w-0 flex-1">
              <b className="block text-[15px] font-medium truncate">{p.nombre}</b>
              <span className="text-xs text-mute block">
                {p.fecha ? p.fecha.split("-").reverse().join("/") + " · " : ""}
                {p.lugar ? p.lugar + " · " : ""}
                {p.equipos} equipos · {p.nadadores} nadadores
              </span>
            </Link>
            {confirmando === p.id ? (
              <div className="shrink-0 flex gap-1.5">
                <button
                  onClick={() => borrar(p.id)}
                  className="min-h-[40px] px-2.5 rounded-lg border border-run text-run font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
                >
                  Sí, borrar
                </button>
                <button
                  onClick={() => setConfirmando(null)}
                  className="min-h-[40px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmando(p.id)}
                className="shrink-0 min-h-[40px] px-2.5 rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
              >
                Borrar
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
