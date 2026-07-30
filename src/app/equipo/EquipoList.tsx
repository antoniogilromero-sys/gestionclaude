"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aprobarEntrenador, darDeBaja, reactivar } from "./actions";

type Perfil = {
  id: string;
  nombre: string;
  email: string;
  rol: "director" | "entrenador" | "pendiente";
  activo: boolean;
};

export function EquipoList({ perfiles }: { perfiles: Perfil[] }) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar(id: string, accion: (id: string) => Promise<void>) {
    setCargando(id);
    setError(null);
    try {
      await accion(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción");
    } finally {
      setCargando(null);
    }
  }

  const pendientes = perfiles.filter((p) => p.rol === "pendiente");
  const entrenadores = perfiles.filter((p) => p.rol === "entrenador");

  return (
    <div>
      {error && <p className="text-run text-sm mb-3.5">{error}</p>}
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Pendientes de aprobar
      </h2>
      {pendientes.length === 0 && (
        <p className="text-mute text-sm mb-4">No hay altas pendientes.</p>
      )}
      {pendientes.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
        >
          <div className="min-w-0">
            <b className="block text-[15px] font-medium truncate">{p.nombre}</b>
            <span className="text-xs text-mute truncate">{p.email}</span>
          </div>
          <button
            disabled={cargando === p.id}
            onClick={() => ejecutar(p.id, aprobarEntrenador)}
            className="shrink-0 bg-signal text-[#160800] rounded-[9px] px-3.5 py-2 font-display text-xs tracking-[.08em] uppercase font-semibold cursor-pointer disabled:opacity-60"
          >
            Aprobar
          </button>
        </div>
      ))}

      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mt-5 mb-2.5">
        Entrenadores
      </h2>
      {entrenadores.length === 0 && (
        <p className="text-mute text-sm">No hay entrenadores dados de alta.</p>
      )}
      {entrenadores.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
        >
          <div className="min-w-0">
            <b className="block text-[15px] font-medium truncate">{p.nombre}</b>
            <span className="text-xs text-mute truncate">
              {p.email} {!p.activo && "· de baja"}
            </span>
          </div>
          {p.activo ? (
            <button
              disabled={cargando === p.id}
              onClick={() => ejecutar(p.id, darDeBaja)}
              className="shrink-0 bg-transparent border border-edge text-chalk rounded-[9px] px-3.5 py-2 font-display text-xs tracking-[.08em] uppercase cursor-pointer disabled:opacity-60"
            >
              Dar de baja
            </button>
          ) : (
            <button
              disabled={cargando === p.id}
              onClick={() => ejecutar(p.id, reactivar)}
              className="shrink-0 bg-transparent border border-edge text-chalk rounded-[9px] px-3.5 py-2 font-display text-xs tracking-[.08em] uppercase cursor-pointer disabled:opacity-60"
            >
              Reactivar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
