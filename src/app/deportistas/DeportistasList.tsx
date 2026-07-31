"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { altaDeportista, cambiarActivo, cambiarGrupo } from "./actions";

type Deportista = {
  id: number;
  ref: string | null;
  nombre: string;
  categoria: string | null;
  grupo_id: number | null;
  activo: boolean;
};

type Grupo = { id: number; nombre: string };

export function DeportistasList({
  deportistas,
  grupos,
}: {
  deportistas: Deportista[];
  grupos: Grupo[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState<number | null>(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [nuevoRef, setNuevoRef] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevoGrupo, setNuevoGrupo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return deportistas;
    return deportistas.filter(
      (d) =>
        d.nombre.toLowerCase().includes(q) || (d.ref ?? "").toLowerCase().includes(q),
    );
  }, [deportistas, busqueda]);

  async function onCambiarGrupo(id: number, grupoId: string) {
    setCargando(id);
    setError(null);
    const resultado = await cambiarGrupo(id, grupoId ? Number(grupoId) : null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
    setCargando(null);
  }

  async function onCambiarActivo(id: number, activo: boolean) {
    setCargando(id);
    setError(null);
    const resultado = await cambiarActivo(id, activo);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
    setCargando(null);
  }

  async function onAlta() {
    setError(null);
    if (!nuevoNombre.trim()) {
      setError("Falta el nombre");
      return;
    }
    setEnviando(true);
    const resultado = await altaDeportista({
      ref: nuevoRef,
      nombre: nuevoNombre,
      categoria: nuevaCategoria,
      grupoId: nuevoGrupo ? Number(nuevoGrupo) : null,
    });
    if ("error" in resultado) {
      setError(resultado.error);
    } else {
      setNuevoRef("");
      setNuevoNombre("");
      setNuevaCategoria("");
      setNuevoGrupo("");
      setMostrarAlta(false);
      router.refresh();
    }
    setEnviando(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Deportistas ({deportistas.length})
        </h2>
        <button
          onClick={() => setMostrarAlta((v) => !v)}
          className="font-display text-xs tracking-[.08em] uppercase text-signal shrink-0"
        >
          {mostrarAlta ? "Cancelar" : "+ Alta"}
        </button>
      </div>

      {mostrarAlta && (
        <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <input
              placeholder="Ref (D081)"
              value={nuevoRef}
              onChange={(e) => setNuevoRef(e.target.value)}
              className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
            />
            <input
              placeholder="Categoría"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
            />
          </div>
          <input
            placeholder="Nombre completo"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mt-2.5"
          />
          <select
            value={nuevoGrupo}
            onChange={(e) => setNuevoGrupo(e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mt-2.5"
          >
            <option value="">Sin grupo</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
          <button
            onClick={onAlta}
            disabled={enviando}
            className="w-full bg-signal text-[#160800] rounded-[9px] py-2.5 font-display text-sm tracking-[.09em] uppercase font-semibold cursor-pointer mt-3 disabled:opacity-60"
          >
            {enviando ? "Guardando…" : "Dar de alta"}
          </button>
        </div>
      )}

      <input
        placeholder="Buscar por nombre o ref…"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm mb-2"
      />
      {error && <p className="text-run text-sm mb-3.5">{error}</p>}

      {filtrados.map((d) => (
        <div
          key={d.id}
          className={`bg-surf border rounded-[10px] p-3 mb-2 ${d.activo ? "border-edge" : "border-edge opacity-50"}`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="min-w-0">
              <b className="block text-[15px] font-medium truncate">{d.nombre}</b>
              <span className="text-xs text-mute">
                {d.ref ?? "sin ref"} · {d.categoria ?? "?"}
                {!d.activo && " · de baja"}
              </span>
            </div>
            <button
              disabled={cargando === d.id}
              onClick={() => onCambiarActivo(d.id, !d.activo)}
              className="shrink-0 bg-transparent border border-edge text-chalk rounded-lg min-h-[44px] px-3 flex items-center justify-center font-display text-xs tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
            >
              {d.activo ? "Dar de baja" : "Reactivar"}
            </button>
          </div>
          <select
            value={d.grupo_id ?? ""}
            disabled={cargando === d.id}
            onChange={(e) => onCambiarGrupo(d.id, e.target.value)}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-2 text-sm"
          >
            <option value="">Sin asignar</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </div>
      ))}
      {filtrados.length === 0 && (
        <p className="text-mute text-sm text-center py-6">Sin resultados.</p>
      )}
    </div>
  );
}
