"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { vincularDeportista, borrarInscripcion } from "./actions";

type Inscripcion = {
  id: number;
  email: string;
  nombre_completo: string;
  dni: string | null;
  fecha_nacimiento: string | null;
  domicilio: string | null;
  talla_camiseta: string | null;
  dias_piscina: string | null;
  proteccion_datos: string | null;
  derechos_imagen: string | null;
  telefono: string | null;
  deportista_id: number | null;
  creado_en: string;
};

type Deportista = { id: number; nombre: string };

export function InscripcionesList({
  inscripciones,
  deportistas,
}: {
  inscripciones: Inscripcion[];
  deportistas: Deportista[];
}) {
  const router = useRouter();
  const [abierta, setAbierta] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [cargando, setCargando] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onVincular(id: number, deportistaId: string) {
    setCargando(id);
    setError(null);
    const resultado = await vincularDeportista(id, deportistaId ? Number(deportistaId) : null);
    setCargando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  async function onBorrar(id: number) {
    setCargando(id);
    setError(null);
    const resultado = await borrarInscripcion(id);
    setCargando(null);
    setConfirmando(null);
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  if (inscripciones.length === 0) {
    return (
      <p className="text-mute text-sm text-center py-6">
        Todavía no ha llegado ninguna inscripción.
      </p>
    );
  }

  return (
    <div>
      {error && <p className="text-run text-sm mb-3.5">{error}</p>}

      {inscripciones.map((i) => {
        const abiertaAqui = abierta === i.id;
        return (
          <div key={i.id} className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5">
            <button
              onClick={() => setAbierta(abiertaAqui ? null : i.id)}
              className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
            >
              <div className="min-w-0">
                <b className="block text-[15px] font-medium truncate">{i.nombre_completo}</b>
                <span className="text-xs text-mute truncate block">{i.email}</span>
              </div>
              <span className="shrink-0 font-display text-xs uppercase text-mute">
                {i.deportista_id ? "Vinculada" : "Sin vincular"}
              </span>
            </button>

            {abiertaAqui && (
              <div className="mt-3 pt-3 border-t border-edge space-y-1.5 text-sm">
                {i.dni && (
                  <p>
                    <span className="text-mute">DNI:</span> {i.dni}
                  </p>
                )}
                {i.fecha_nacimiento && (
                  <p>
                    <span className="text-mute">Nacimiento:</span>{" "}
                    {i.fecha_nacimiento.split("-").reverse().join("/")}
                  </p>
                )}
                {i.telefono && (
                  <p>
                    <span className="text-mute">Teléfono:</span> {i.telefono}
                  </p>
                )}
                {i.domicilio && (
                  <p>
                    <span className="text-mute">Domicilio:</span> {i.domicilio}
                  </p>
                )}
                {i.talla_camiseta && (
                  <p>
                    <span className="text-mute">Talla:</span> {i.talla_camiseta}
                  </p>
                )}
                {i.dias_piscina && (
                  <p>
                    <span className="text-mute">Días de piscina:</span> {i.dias_piscina}
                  </p>
                )}
                {i.proteccion_datos && (
                  <p className="text-xs text-mute italic">{i.proteccion_datos}</p>
                )}
                {i.derechos_imagen && (
                  <p className="text-xs text-mute italic">{i.derechos_imagen}</p>
                )}

                <label className="block font-display text-[11px] tracking-[.08em] uppercase text-mute mt-3 mb-1">
                  Vincular a deportista
                </label>
                <select
                  value={i.deportista_id ?? ""}
                  disabled={cargando === i.id}
                  onChange={(e) => onVincular(i.id, e.target.value)}
                  className="w-full bg-deep border border-edge text-chalk rounded-lg p-2 text-sm"
                >
                  <option value="">Sin vincular</option>
                  {deportistas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </select>

                <div className="pt-2">
                  {confirmando === i.id ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onBorrar(i.id)}
                        disabled={cargando === i.id}
                        className="min-h-[44px] px-3 rounded-lg border border-run text-run font-display text-xs tracking-[.06em] uppercase cursor-pointer disabled:opacity-60"
                      >
                        {cargando === i.id ? "Borrando…" : "Sí, borrar"}
                      </button>
                      <button
                        onClick={() => setConfirmando(null)}
                        className="min-h-[44px] px-3 rounded-lg border border-edge text-mute font-display text-xs tracking-[.06em] uppercase cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmando(i.id)}
                      className="min-h-[44px] px-3 rounded-lg border border-edge text-mute font-display text-xs tracking-[.06em] uppercase cursor-pointer"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
