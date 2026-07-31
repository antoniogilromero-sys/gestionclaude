"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aprobarEntrenador, darDeBaja, reactivar, cambiarNombre, cambiarTelefono } from "./actions";

type Perfil = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: "director" | "entrenador" | "pendiente";
  activo: boolean;
};

export function EquipoList({ perfiles }: { perfiles: Perfil[] }) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);

  async function ejecutar(id: string, accion: (id: string) => Promise<{ error: string } | { ok: true }>) {
    setCargando(id);
    setError(null);
    const resultado = await accion(id);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
    setCargando(null);
  }

  async function guardarDatos(id: string, nombre: string, telefono: string) {
    setCargando(id);
    setError(null);
    const r1 = await cambiarNombre(id, nombre);
    if ("error" in r1) {
      setError(r1.error);
      setCargando(null);
      return;
    }
    const r2 = await cambiarTelefono(id, telefono);
    if ("error" in r2) {
      setError(r2.error);
      setCargando(null);
      return;
    }
    setEditando(null);
    setCargando(null);
    router.refresh();
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
        <Fila
          key={p.id}
          perfil={p}
          editando={editando === p.id}
          cargando={cargando === p.id}
          onEditar={() => setEditando(p.id)}
          onGuardar={(nombre, telefono) => guardarDatos(p.id, nombre, telefono)}
          onCancelar={() => setEditando(null)}
        >
          <button
            disabled={cargando === p.id}
            onClick={() => ejecutar(p.id, aprobarEntrenador)}
            className="shrink-0 bg-signal text-[#160800] rounded-[9px] px-3.5 py-2 font-display text-xs tracking-[.08em] uppercase font-semibold cursor-pointer disabled:opacity-60"
          >
            Aprobar
          </button>
        </Fila>
      ))}

      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mt-5 mb-2.5">
        Entrenadores
      </h2>
      {entrenadores.length === 0 && (
        <p className="text-mute text-sm">No hay entrenadores dados de alta.</p>
      )}
      {entrenadores.map((p) => (
        <Fila
          key={p.id}
          perfil={p}
          editando={editando === p.id}
          cargando={cargando === p.id}
          onEditar={() => setEditando(p.id)}
          onGuardar={(nombre, telefono) => guardarDatos(p.id, nombre, telefono)}
          onCancelar={() => setEditando(null)}
        >
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
        </Fila>
      ))}
    </div>
  );
}

function Fila({
  perfil,
  editando,
  cargando,
  onEditar,
  onGuardar,
  onCancelar,
  children,
}: {
  perfil: Perfil;
  editando: boolean;
  cargando: boolean;
  onEditar: () => void;
  onGuardar: (nombre: string, telefono: string) => void;
  onCancelar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5">
      {editando ? (
        <DatosEditor
          nombreInicial={perfil.nombre}
          telefonoInicial={perfil.telefono ?? ""}
          cargando={cargando}
          onGuardar={onGuardar}
          onCancelar={onCancelar}
        />
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <b className="text-[15px] font-medium truncate">{perfil.nombre}</b>
              <button onClick={onEditar} className="shrink-0 text-mute text-xs underline">
                editar
              </button>
            </div>
            <span className="text-xs text-mute truncate block">
              {perfil.email}
              {perfil.telefono && ` · ${perfil.telefono}`}
              {!perfil.activo && " · de baja"}
            </span>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

function DatosEditor({
  nombreInicial,
  telefonoInicial,
  cargando,
  onGuardar,
  onCancelar,
}: {
  nombreInicial: string;
  telefonoInicial: string;
  cargando: boolean;
  onGuardar: (nombre: string, telefono: string) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);

  return (
    <div className="space-y-2">
      <div>
        <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
          Nombre
        </label>
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full bg-deep border border-edge text-chalk rounded-lg px-2.5 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="—"
          onKeyDown={(e) => {
            if (e.key === "Enter") onGuardar(nombre, telefono);
            if (e.key === "Escape") onCancelar();
          }}
          className="w-full bg-deep border border-edge text-chalk rounded-lg px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          disabled={cargando}
          onClick={() => onGuardar(nombre, telefono)}
          className="bg-signal text-[#160800] rounded-lg px-3 py-1.5 font-display text-xs uppercase font-semibold cursor-pointer disabled:opacity-60"
        >
          Guardar
        </button>
        <button disabled={cargando} onClick={onCancelar} className="text-mute text-xs underline">
          Cancelar
        </button>
      </div>
    </div>
  );
}
