"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { altaDeportista, cambiarActivo, actualizarGrupos, actualizarDatos } from "./actions";

type Deportista = {
  id: number;
  ref: string | null;
  nombre: string;
  categoria: string | null;
  grupoIds: number[];
  activo: boolean;
};

type Grupo = { id: number; nombre: string };

export function DeportistasList({
  deportistas,
  grupos,
  esDirector,
}: {
  deportistas: Deportista[];
  grupos: Grupo[];
  esDirector: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState<number | null>(null);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);
  const [editandoGrupos, setEditandoGrupos] = useState<number | null>(null);
  const [editandoDatos, setEditandoDatos] = useState<number | null>(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [nuevoRef, setNuevoRef] = useState("");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevosGrupos, setNuevosGrupos] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const nombrePorGrupoId = useMemo(
    () => new Map(grupos.map((g) => [g.id, g.nombre])),
    [grupos],
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return deportistas;
    return deportistas.filter(
      (d) =>
        d.nombre.toLowerCase().includes(q) || (d.ref ?? "").toLowerCase().includes(q),
    );
  }, [deportistas, busqueda]);

  async function onGuardarGrupos(id: number, grupoIds: number[]) {
    setCargando(id);
    setError(null);
    const resultado = await actualizarGrupos(id, grupoIds);
    if ("error" in resultado) setError(resultado.error);
    else {
      setEditandoGrupos(null);
      router.refresh();
    }
    setCargando(null);
  }

  async function copiarEnlaceStrava(id: number) {
    const url = `https://triatlonalpedrete.vercel.app/strava-conectar/${id}`;
    await navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId((v) => (v === id ? null : v)), 2000);
  }

  async function onGuardarDatos(id: number, datos: { ref: string; nombre: string; categoria: string }) {
    setCargando(id);
    setError(null);
    const resultado = await actualizarDatos(id, datos);
    if ("error" in resultado) setError(resultado.error);
    else {
      setEditandoDatos(null);
      router.refresh();
    }
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
      grupoIds: nuevosGrupos,
    });
    if ("error" in resultado) {
      setError(resultado.error);
    } else {
      setNuevoRef("");
      setNuevoNombre("");
      setNuevaCategoria("");
      setNuevosGrupos([]);
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
        {esDirector && (
          <button
            onClick={() => setMostrarAlta((v) => !v)}
            className="font-display text-xs tracking-[.08em] uppercase text-signal shrink-0"
          >
            {mostrarAlta ? "Cancelar" : "+ Alta"}
          </button>
        )}
      </div>

      {esDirector && mostrarAlta && (
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
          <span className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[7px]">
            Grupos
          </span>
          <ChipsGrupos
            grupos={grupos}
            seleccionados={nuevosGrupos}
            onCambiar={setNuevosGrupos}
          />
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
              <div className="flex items-center gap-1.5">
                <b className="block text-[15px] font-medium truncate">{d.nombre}</b>
                {esDirector && (
                  <button
                    onClick={() => setEditandoDatos(d.id)}
                    className="shrink-0 text-mute text-xs underline"
                  >
                    editar
                  </button>
                )}
              </div>
              <span className="text-xs text-mute">
                {d.ref ?? "sin ref"} · {d.categoria ?? "sin categoría"}
                {!d.activo && " · de baja"}
              </span>
            </div>
            {esDirector && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => copiarEnlaceStrava(d.id)}
                  title="Copiar enlace para conectar Strava"
                  className="bg-transparent border border-edge text-mute rounded-lg min-h-[44px] px-2.5 flex items-center justify-center font-display text-xs tracking-[.04em] cursor-pointer"
                >
                  {copiadoId === d.id ? "Copiado ✓" : "Enlace Strava"}
                </button>
                <button
                  disabled={cargando === d.id}
                  onClick={() => onCambiarActivo(d.id, !d.activo)}
                  className="bg-transparent border border-edge text-chalk rounded-lg min-h-[44px] px-3 flex items-center justify-center font-display text-xs tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                >
                  {d.activo ? "Dar de baja" : "Reactivar"}
                </button>
              </div>
            )}
          </div>

          {esDirector && editandoDatos === d.id && (
            <EditorDatos
              refInicial={d.ref ?? ""}
              nombreInicial={d.nombre}
              categoriaInicial={d.categoria ?? ""}
              cargando={cargando === d.id}
              onGuardar={(datos) => onGuardarDatos(d.id, datos)}
              onCancelar={() => setEditandoDatos(null)}
            />
          )}

          {esDirector && editandoGrupos === d.id ? (
            <EditorGrupos
              grupos={grupos}
              grupoIdsIniciales={d.grupoIds}
              cargando={cargando === d.id}
              onGuardar={(ids) => onGuardarGrupos(d.id, ids)}
              onCancelar={() => setEditandoGrupos(null)}
            />
          ) : (
            <div
              onClick={() => esDirector && setEditandoGrupos(d.id)}
              className={`w-full text-left bg-deep border border-edge rounded-lg p-2 text-sm text-chalk ${esDirector ? "cursor-pointer" : ""}`}
            >
              {d.grupoIds.length === 0 ? (
                <span className="text-mute">Sin grupo asignado</span>
              ) : (
                d.grupoIds
                  .map((id) => nombrePorGrupoId.get(id))
                  .filter(Boolean)
                  .join(" · ")
              )}
            </div>
          )}
        </div>
      ))}
      {filtrados.length === 0 && (
        <p className="text-mute text-sm text-center py-6">Sin resultados.</p>
      )}
    </div>
  );
}

function ChipsGrupos({
  grupos,
  seleccionados,
  onCambiar,
}: {
  grupos: Grupo[];
  seleccionados: number[];
  onCambiar: (ids: number[]) => void;
}) {
  function toggle(id: number) {
    onCambiar(
      seleccionados.includes(id)
        ? seleccionados.filter((x) => x !== id)
        : [...seleccionados, id],
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {grupos.map((g) => {
        const on = seleccionados.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            aria-pressed={on}
            className={`px-3 py-1.5 rounded-full border font-display text-xs tracking-[.04em] cursor-pointer ${
              on
                ? "bg-signal text-[#160800] border-signal font-semibold"
                : "bg-deep text-mute border-edge"
            }`}
          >
            {g.nombre}
          </button>
        );
      })}
    </div>
  );
}

function EditorGrupos({
  grupos,
  grupoIdsIniciales,
  cargando,
  onGuardar,
  onCancelar,
}: {
  grupos: Grupo[];
  grupoIdsIniciales: number[];
  cargando: boolean;
  onGuardar: (ids: number[]) => void;
  onCancelar: () => void;
}) {
  const [seleccionados, setSeleccionados] = useState<number[]>(grupoIdsIniciales);
  return (
    <div className="bg-deep border border-edge rounded-lg p-2.5">
      <ChipsGrupos grupos={grupos} seleccionados={seleccionados} onCambiar={setSeleccionados} />
      <div className="flex gap-2 mt-2.5">
        <button
          type="button"
          disabled={cargando}
          onClick={() => onGuardar(seleccionados)}
          className="flex-1 bg-signal text-[#160800] rounded-lg min-h-[38px] font-display text-xs tracking-[.08em] uppercase font-semibold cursor-pointer disabled:opacity-60"
        >
          {cargando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          disabled={cargando}
          onClick={onCancelar}
          className="flex-1 bg-transparent border border-edge text-chalk rounded-lg min-h-[38px] font-display text-xs tracking-[.08em] uppercase cursor-pointer disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function EditorDatos({
  refInicial,
  nombreInicial,
  categoriaInicial,
  cargando,
  onGuardar,
  onCancelar,
}: {
  refInicial: string;
  nombreInicial: string;
  categoriaInicial: string;
  cargando: boolean;
  onGuardar: (datos: { ref: string; nombre: string; categoria: string }) => void;
  onCancelar: () => void;
}) {
  const [ref, setRef] = useState(refInicial);
  const [nombre, setNombre] = useState(nombreInicial);
  const [categoria, setCategoria] = useState(categoriaInicial);

  return (
    <div className="bg-deep border border-edge rounded-lg p-2.5 mb-2.5">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          placeholder="Ref (D081)"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="w-full bg-surf border border-edge text-chalk rounded-lg p-2 text-sm"
        />
        <input
          placeholder="Categoría"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full bg-surf border border-edge text-chalk rounded-lg p-2 text-sm"
        />
      </div>
      <input
        placeholder="Nombre completo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="w-full bg-surf border border-edge text-chalk rounded-lg p-2 text-sm mb-2"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={cargando}
          onClick={() => onGuardar({ ref, nombre, categoria })}
          className="flex-1 bg-signal text-[#160800] rounded-lg min-h-[38px] font-display text-xs tracking-[.08em] uppercase font-semibold cursor-pointer disabled:opacity-60"
        >
          {cargando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          disabled={cargando}
          onClick={onCancelar}
          className="flex-1 bg-transparent border border-edge text-chalk rounded-lg min-h-[38px] font-display text-xs tracking-[.08em] uppercase cursor-pointer disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
