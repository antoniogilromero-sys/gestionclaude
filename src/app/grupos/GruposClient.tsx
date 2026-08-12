"use client";

import { useMemo, useState } from "react";

type Grupo = { id: number; nombre: string };
type Deportista = { id: number; nombre: string; categoria: string | null };
type DepGrupo = { deportista_id: number; grupo_id: number };

// Colores por grupo, para distinguirlos de un vistazo. Sin entrada aquí,
// se usa el color por defecto (COLOR_DEFECTO).
const COLOR_GRUPO: Record<string, string> = {
  "Martes Peques 19h": "#FF6EC7",
};
const COLOR_DEFECTO = "#7FA5B0";

function colorDe(nombre: string) {
  return COLOR_GRUPO[nombre] ?? COLOR_DEFECTO;
}

export function GruposClient({
  grupos,
  deportistas,
  depGrupos,
}: {
  grupos: Grupo[];
  deportistas: Deportista[];
  depGrupos: DepGrupo[];
}) {
  const [grupoId, setGrupoId] = useState<number | undefined>(grupos[0]?.id);

  const deportistaPorId = useMemo(
    () => new Map(deportistas.map((d) => [d.id, d])),
    [deportistas],
  );

  const miembros = useMemo(() => {
    if (!grupoId) return [];
    const ids = depGrupos.filter((dg) => dg.grupo_id === grupoId).map((dg) => dg.deportista_id);
    return ids
      .map((id) => deportistaPorId.get(id))
      .filter((d): d is Deportista => !!d)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [grupoId, depGrupos, deportistaPorId]);

  const grupo = grupos.find((g) => g.id === grupoId);
  const color = grupo ? colorDe(grupo.nombre) : COLOR_DEFECTO;

  return (
    <div>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Grupos
      </h2>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {grupos.map((g) => {
          const on = g.id === grupoId;
          const c = colorDe(g.nombre);
          return (
            <button
              key={g.id}
              onClick={() => setGrupoId(g.id)}
              aria-pressed={on}
              style={
                on
                  ? { backgroundColor: c, borderColor: c, color: "#160800" }
                  : { borderColor: c, color: c }
              }
              className="px-3 py-1.5 rounded-full border font-display text-xs tracking-[.04em] cursor-pointer font-semibold"
            >
              {g.nombre}
            </button>
          );
        })}
      </div>

      {grupo && (
        <div
          className="rounded-[10px] p-3.5 mb-3.5 border"
          style={{ borderColor: color, backgroundColor: `${color}1A` }}
        >
          <b className="block text-[15px] font-medium mb-0.5" style={{ color }}>
            {grupo.nombre}
          </b>
          <span className="text-xs text-mute">
            {miembros.length} {miembros.length === 1 ? "deportista" : "deportistas"}
          </span>
        </div>
      )}

      {miembros.length === 0 ? (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">
            Nadie asignado todavía
          </b>
          Ve a Deportistas para apuntar a alguien a este grupo.
        </div>
      ) : (
        miembros.map((d, i) => (
          <div
            key={d.id}
            className="flex items-center gap-[11px] px-[13px] py-3 bg-surf border border-edge rounded-[10px] mb-[7px]"
          >
            <span className="font-display text-[13px] text-mute min-w-[34px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 min-w-0">
              <b className="block text-[15px] font-medium truncate">{d.nombre}</b>
              <span className="text-xs text-mute">{d.categoria ?? "?"}</span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
