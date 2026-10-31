"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  anadirMiembro,
  quitarMiembro,
  moverMiembro,
  crearEquipo,
  ponerTiempoMiembro,
} from "../actions";

type Miembro = {
  id: number;
  deportistaId: number | null;
  nombre: string;
  club: string | null;
  tiempoManual: number | null;
  tiempoTest: number | null;
};
type Equipo = { id: number; nombre: string; miembros: Miembro[] };
type Deportista = { id: number; nombre: string };
type Accion = () => Promise<{ error: string } | { ok: true }>;

function fmt(segundos: number) {
  const total = Math.round(segundos);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Acepta "2:10", "2:34,7", "2.10" (así lo escribe Antón: 2 min 10 s) o los
// segundos sueltos ("130"). Devuelve null si no se entiende.
function parseTiempo(texto: string): number | null {
  const t = texto.trim().replace(",", ".");
  let m = t.match(/^(\d{1,2}):(\d{1,2})(\.\d+)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(m[3]) : 0);
  m = t.match(/^(\d)\.(\d{2})$/);
  if (m && Number(m[2]) < 60) return Number(m[1]) * 60 + Number(m[2]);
  m = t.match(/^\d+(\.\d+)?$/);
  if (m && Number(t) >= 20) return Number(t);
  return null;
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

  async function ejecutar(accion: Accion) {
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
          avisar={setError}
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
  avisar,
}: {
  equipo: Equipo;
  otros: Equipo[];
  deportistas: Deportista[];
  ejecutar: (accion: Accion) => Promise<void>;
  avisar: (mensaje: string | null) => void;
}) {
  const [texto, setTexto] = useState("");
  const [club, setClub] = useState("");

  const tiempoDe = (m: Miembro) => m.tiempoManual ?? m.tiempoTest;
  const conTiempo = equipo.miembros.filter((m) => tiempoDe(m) != null);
  const suma = conTiempo.reduce((s, m) => s + (tiempoDe(m) ?? 0), 0);
  const sinTiempo = equipo.miembros.length - conTiempo.length;

  async function anadir() {
    const limpio = texto.trim();
    if (!limpio) return;
    // Si el texto coincide exactamente con una ficha, se vincula; si no, queda
    // como nombre libre (alguien de otro club, o sin ficha todavía).
    const ficha = deportistas.find((d) => d.nombre.toLowerCase() === limpio.toLowerCase());
    await ejecutar(() => anadirMiembro(equipo.id, ficha?.id ?? null, ficha?.nombre ?? limpio, club));
    setTexto("");
    setClub("");
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
        <FilaMiembro
          key={`${m.id}-${m.tiempoManual}-${m.tiempoTest}`}
          miembro={m}
          otros={otros}
          ejecutar={ejecutar}
          avisar={avisar}
        />
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
        <input
          value={club}
          onChange={(e) => setClub(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && anadir()}
          placeholder="Club"
          aria-label="Club, solo si no es del nuestro"
          className="w-[72px] shrink-0 bg-deep border border-edge text-chalk rounded-lg p-2.5 text-sm"
        />
        <button
          onClick={anadir}
          className="shrink-0 min-h-[44px] px-3 rounded-lg bg-signal text-[#160800] font-display text-xs tracking-[.06em] uppercase font-semibold cursor-pointer"
        >
          Añadir
        </button>
      </div>
      <p className="text-[11px] text-mute mt-1.5">
        El club solo se pone si el nadador no es del nuestro (ej. GSD).
      </p>
    </div>
  );
}

function FilaMiembro({
  miembro: m,
  otros,
  ejecutar,
  avisar,
}: {
  miembro: Miembro;
  otros: Equipo[];
  ejecutar: (accion: Accion) => Promise<void>;
  avisar: (mensaje: string | null) => void;
}) {
  const inicial = m.tiempoManual ?? m.tiempoTest;
  const [valor, setValor] = useState(inicial != null ? fmt(inicial) : "");

  async function guardarTiempo() {
    const original = inicial != null ? fmt(inicial) : "";
    if (valor.trim() === original) return;
    if (valor.trim() === "") {
      await ejecutar(() => ponerTiempoMiembro(m.id, null));
      return;
    }
    const segundos = parseTiempo(valor);
    if (segundos == null) {
      avisar(`No entiendo el tiempo "${valor}". Escríbelo como 2:10 o 2:34,7.`);
      setValor(original);
      return;
    }
    await ejecutar(() => ponerTiempoMiembro(m.id, segundos));
  }

  return (
    <div className="flex items-center gap-2 py-2 border-t border-edge/60 text-sm">
      <span className="flex-1 min-w-0 truncate">
        {m.nombre}
        {m.club && (
          <span className="text-[10px] text-signal ml-1.5 uppercase border border-signal/50 rounded px-1">
            {m.club}
          </span>
        )}
        {m.deportistaId == null && !m.club && (
          <span className="text-[10px] text-mute ml-1.5 uppercase">sin ficha</span>
        )}
      </span>
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={guardarTiempo}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        inputMode="decimal"
        placeholder="m:ss"
        aria-label={`200 m de ${m.nombre}`}
        title={
          m.tiempoManual != null
            ? "Tiempo puesto a mano"
            : m.tiempoTest != null
              ? "Mejor 200 m de sus tests (escribe otro para cambiarlo)"
              : "Escribe su 200 m"
        }
        className={`w-[66px] shrink-0 bg-deep border rounded-lg px-2 py-1.5 text-sm text-center font-display tabular-nums ${
          m.tiempoManual != null ? "border-signal/60 text-chalk" : "border-edge text-chalk"
        }`}
      />
      {otros.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            const destino = Number(e.target.value);
            if (destino) ejecutar(() => moverMiembro(m.id, destino));
          }}
          aria-label={`Mover a ${m.nombre}`}
          className="shrink-0 bg-deep border border-edge text-mute rounded-lg px-1.5 py-1 text-xs max-w-[84px]"
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
  );
}
