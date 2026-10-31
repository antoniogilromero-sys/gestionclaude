"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { anadirMiembro, quitarMiembro, moverMiembro, crearEquipo } from "../actions";

type Miembro = { id: number; deportistaId: number | null; nombre: string; tiempo: number | null };
type Equipo = { id: number; nombre: string; miembros: Miembro[] };
type Deportista = { id: number; nombre: string };

function fmt(segundos: number) {
  const total = Math.round(segundos);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function EquiposEditor({
  pruebaId,
  equipos,
  deportistas,
}: {
  pruebaId: number;
  equipos: Equipo[];
  deportistas: Deportista[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [nuevoEquipo, setNuevoEquipo] = useState("");

  async function ejecutar(accion: () => Promise<{ error: string } | { ok: true }>) {
    setError(null);
    const resultado = await accion();
    if ("error" in resultado) setError(resultado.error);
    else router.refresh();
  }

  return (
    <div>
      <datalist id="lista-deportistas">
        {deportistas.map((d) => (
          <option key={d.id} value={d.nombre} />
        ))}
      </datalist>

      {error && <p className="text-run text-sm mb-3">{error}</p>}

      {equipos.map((e) => (
        <EquipoCard
          key={e.id}
          equipo={e}
          otros={equipos.filter((x) => x.id !== e.id)}
          deportistas={deportistas}
          ejecutar={ejecutar}
        />
      ))}

      <div className="flex gap-2 mt-1">
        <input
          value={nuevoEquipo}
          onChange={(e) => setNuevoEquipo(e.target.value)}
          placeholder="Otro equipo (ej. Equipo 3)"
          className="flex-1 min-w-0 bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
        />
        <button
          onClick={async () => {
            await ejecutar(() => crearEquipo(pruebaId, nuevoEquipo));
            setNuevoEquipo("");
          }}
          className="shrink-0 min-h-[44px] px-3 rounded-lg border border-edge text-mute font-display text-xs tracking-[.06em] uppercase cursor-pointer"
        >
          + Equipo
        </button>
      </div>
    </div>
  );
}

function EquipoCard({
  equipo,
  otros,
  deportistas,
  ejecutar,
}: {
  equipo: Equipo;
  otros: Equipo[];
  deportistas: Deportista[];
  ejecutar: (accion: () => Promise<{ error: string } | { ok: true }>) => Promise<void>;
}) {
  const [texto, setTexto] = useState("");

  const conTiempo = equipo.miembros.filter((m) => m.tiempo != null);
  const suma = conTiempo.reduce((s, m) => s + (m.tiempo ?? 0), 0);
  const sinTiempo = equipo.miembros.length - conTiempo.length;

  async function anadir() {
    const limpio = texto.trim();
    if (!limpio) return;
    // Si el texto coincide exactamente con una ficha, se vincula; si no, queda
    // como nombre libre (se puede vincular más adelante).
    const ficha = deportistas.find((d) => d.nombre.toLowerCase() === limpio.toLowerCase());
    await ejecutar(() => anadirMiembro(equipo.id, ficha?.id ?? null, ficha?.nombre ?? limpio));
    setTexto("");
  }

  return (
    <div className="bg-surf border border-edge rounded-[10px] p-3.5 mb-3.5">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <b className="font-display text-[15px] tracking-[.06em] uppercase">{equipo.nombre}</b>
        <span className="text-xs text-mute">{equipo.miembros.length} nadadores</span>
      </div>
      {conTiempo.length > 0 && (
        <p className="text-xs text-mute mb-2.5">
          200 m: suma {fmt(suma)} · media {fmt(suma / conTiempo.length)}
          {sinTiempo > 0 && ` · ${sinTiempo} sin tiempo`}
        </p>
      )}

      {equipo.miembros.length === 0 && (
        <p className="text-mute text-sm py-2">Todavía no hay nadie en este equipo.</p>
      )}
      {equipo.miembros.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-2 py-2 border-t border-edge/60 text-sm"
        >
          <span className="flex-1 min-w-0 truncate">
            {m.nombre}
            {m.deportistaId == null && (
              <span className="text-[10px] text-mute ml-1.5 uppercase">sin ficha</span>
            )}
          </span>
          <span
            className={`font-display tabular-nums shrink-0 ${m.tiempo == null ? "text-mute text-xs" : ""}`}
          >
            {m.tiempo != null ? fmt(m.tiempo) : "sin tiempo"}
          </span>
          {otros.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const destino = Number(e.target.value);
                if (destino) ejecutar(() => moverMiembro(m.id, destino));
              }}
              aria-label={`Mover a ${m.nombre}`}
              className="shrink-0 bg-deep border border-edge text-mute rounded-lg px-1.5 py-1 text-xs max-w-[92px]"
            >
              <option value="">Mover…</option>
              {otros.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => ejecutar(() => quitarMiembro(m.id))}
            aria-label={`Quitar a ${m.nombre}`}
            className="shrink-0 min-h-[36px] min-w-[36px] rounded-lg border border-edge text-mute text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex gap-2 mt-3">
        <input
          list="lista-deportistas"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && anadir()}
          placeholder="Añadir nadador (nombre de la ficha o libre)"
          className="flex-1 min-w-0 bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
        />
        <button
          onClick={anadir}
          className="shrink-0 min-h-[44px] px-3 rounded-lg bg-signal text-[#160800] font-display text-xs tracking-[.06em] uppercase font-semibold cursor-pointer"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
