"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  anadirMiembro,
  quitarMiembro,
  moverMiembro,
  crearEquipo,
  ponerTiempoMiembro,
  ponerTiempoEquipo,
  ponerResultadoMiembro,
} from "../actions";

type Miembro = {
  id: number;
  deportistaId: number | null;
  nombre: string;
  club: string | null;
  tiempoManual: number | null;
  tiempoTest: number | null;
  media100: number | null;
  tramosNadados: number | null;
};
type Equipo = { id: number; nombre: string; tiempoTotal: number | null; miembros: Miembro[] };
type Deportista = { id: number; nombre: string };
type Accion = () => Promise<{ error: string } | { ok: true }>;

function fmt(segundos: number) {
  const total = Math.round(segundos);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Total largo: 3:05:20 o 3:05:20,4. Media con décimas: 1:52,35.
function fmtTotal(segundos: number) {
  const total = Math.round(segundos);
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${Number(m)}:${s}`;
}
function fmtMedia(segundos: number) {
  const centesimas = Math.round(segundos * 100);
  const m = Math.floor(centesimas / 6000);
  const s = String(Math.floor((centesimas % 6000) / 100)).padStart(2, "0");
  const c = String(centesimas % 100).padStart(2, "0");
  return `${m}:${s},${c}`;
}
function parseTotal(texto: string): number | null {
  const t = texto.trim().replace(",", ".");
  const m = t.match(/^(d+):(d{1,2}):(d{1,2})(.d+)?$/);
  if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + (m[4] ? Number(m[4]) : 0);
  return parseTiempo(t);
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
  tramos,
  equipos,
  deportistas,
}: {
  pruebaId: number;
  tramos: number;
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
          tramos={tramos}
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
  tramos,
  otros,
  deportistas,
  ejecutar,
  avisar,
}: {
  equipo: Equipo;
  tramos: number;
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
  // Media del equipo en la prueba: cada media pesa por los 100 m que nadó.
  const conMedia = equipo.miembros.filter((m) => m.media100 != null && (m.tramosNadados ?? 0) > 0);
  const tramosTotales = conMedia.reduce((s, m) => s + (m.tramosNadados ?? 0), 0);
  const mediaEquipo =
    tramosTotales > 0
      ? conMedia.reduce((s, m) => s + (m.media100 ?? 0) * (m.tramosNadados ?? 0), 0) / tramosTotales
      : 0;

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
      {conMedia.length > 0 && (
        <p className="text-xs text-signal mb-1.5">
          Prueba: media {fmtMedia(mediaEquipo)} por 100 m · {tramosTotales} tramos nadados
        </p>
      )}
      {conTiempo.length > 0 && (
        <p className="text-xs text-mute mb-2.5">
          200 m: suma {fmt(suma)} · media {fmt(suma / conTiempo.length)}
          {sinTiempo > 0 && ` · ${sinTiempo} sin tiempo`}
        </p>
      )}

      <ResultadoEquipo
        key={`${equipo.id}-${equipo.tiempoTotal}`}
        equipo={equipo}
        tramos={tramos}
        ejecutar={ejecutar}
        avisar={avisar}
      />

      {equipo.miembros.length === 0 && (
        <p className="text-mute text-sm py-2">Todavía no hay nadie en este equipo.</p>
      )}
      {equipo.miembros.map((m) => (
        <FilaMiembro
          key={`${m.id}-${m.tiempoManual}-${m.tiempoTest}-${m.media100}-${m.tramosNadados}`}
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

  const [mediaTxt, setMediaTxt] = useState(m.media100 != null ? fmtMedia(m.media100) : "");
  const [nTxt, setNTxt] = useState(m.tramosNadados != null ? String(m.tramosNadados) : "");

  async function guardarResultado() {
    const mediaOriginal = m.media100 != null ? fmtMedia(m.media100) : "";
    const nOriginal = m.tramosNadados != null ? String(m.tramosNadados) : "";
    if (mediaTxt.trim() === mediaOriginal && nTxt.trim() === nOriginal) return;
    if (mediaTxt.trim() === "" && nTxt.trim() === "") {
      await ejecutar(() => ponerResultadoMiembro(m.id, null, null));
      return;
    }
    const media = parseTiempo(mediaTxt);
    const n = Number(nTxt);
    if (media == null || !Number.isInteger(n) || n < 1) {
      avisar(`Para ${m.nombre} pon la media (1:52,35) y cuántos 100 m nadó (un número).`);
      setMediaTxt(mediaOriginal);
      setNTxt(nOriginal);
      return;
    }
    await ejecutar(() => ponerResultadoMiembro(m.id, media, n));
  }

  return (
    <div className="py-2 border-t border-edge/60 text-sm">
    <div className="flex items-center gap-2">
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
    <div className="flex items-center gap-2 mt-1.5 pl-0.5 text-[11px] text-mute">
      <span>En la prueba: media 100 m</span>
      <input
        value={mediaTxt}
        onChange={(e) => setMediaTxt(e.target.value)}
        onBlur={guardarResultado}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        placeholder="m:ss,cc"
        inputMode="decimal"
        aria-label={`Media por 100 m de ${m.nombre}`}
        className="w-[78px] bg-deep border border-edge text-chalk rounded-lg px-2 py-1 text-xs text-center font-display tabular-nums"
      />
      <span>×</span>
      <input
        value={nTxt}
        onChange={(e) => setNTxt(e.target.value)}
        onBlur={guardarResultado}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        placeholder="nº"
        inputMode="numeric"
        aria-label={`Cuántos 100 m nadó ${m.nombre}`}
        className="w-[44px] bg-deep border border-edge text-chalk rounded-lg px-2 py-1 text-xs text-center font-display tabular-nums"
      />
      <span>tramos</span>
    </div>
    </div>
  );
}

// Resultado de la prueba: el tiempo total del equipo y, a partir de él, el
// tiempo medio de cada 100 m (total / tramos). Se puede rellenar cualquiera
// de los dos; el otro se calcula.
function ResultadoEquipo({
  equipo,
  tramos,
  ejecutar,
  avisar,
}: {
  equipo: Equipo;
  tramos: number;
  ejecutar: (accion: Accion) => Promise<void>;
  avisar: (mensaje: string | null) => void;
}) {
  const total = equipo.tiempoTotal;
  const [totalTxt, setTotalTxt] = useState(total != null ? fmtTotal(total) : "");
  const [mediaTxt, setMediaTxt] = useState(total != null ? fmtMedia(total / tramos) : "");

  async function guardar(segundos: number | null) {
    await ejecutar(() => ponerTiempoEquipo(equipo.id, segundos));
  }
  async function alSalirTotal() {
    if (totalTxt.trim() === (total != null ? fmtTotal(total) : "")) return;
    if (totalTxt.trim() === "") return guardar(null);
    const s = parseTotal(totalTxt);
    if (s == null) {
      avisar(`No entiendo el tiempo total "${totalTxt}". Escríbelo como 3:05:20.`);
      setTotalTxt(total != null ? fmtTotal(total) : "");
      return;
    }
    await guardar(s);
  }
  async function alSalirMedia() {
    if (mediaTxt.trim() === (total != null ? fmtMedia(total / tramos) : "")) return;
    if (mediaTxt.trim() === "") return guardar(null);
    const s = parseTiempo(mediaTxt);
    if (s == null) {
      avisar(`No entiendo el tiempo medio "${mediaTxt}". Escríbelo como 1:52,35.`);
      setMediaTxt(total != null ? fmtMedia(total / tramos) : "");
      return;
    }
    await guardar(s * tramos);
  }

  const campo =
    "w-full bg-deep border border-edge text-chalk rounded-lg px-2 py-1.5 text-sm text-center font-display tabular-nums";
  return (
    <div className="bg-deep border border-edge rounded-lg p-2.5 mb-2.5">
      <p className="font-display text-[11px] tracking-[.1em] uppercase text-mute mb-1.5">
        Resultado de la prueba · {tramos} tramos
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-mute">
          Tiempo total
          <input
            value={totalTxt}
            onChange={(e) => setTotalTxt(e.target.value)}
            onBlur={alSalirTotal}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="h:mm:ss"
            inputMode="decimal"
            className={campo}
          />
        </label>
        <label className="text-[11px] text-mute">
          Media por 100 m
          <input
            value={mediaTxt}
            onChange={(e) => setMediaTxt(e.target.value)}
            onBlur={alSalirMedia}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="m:ss,cc"
            inputMode="decimal"
            className={campo}
          />
        </label>
      </div>
    </div>
  );
}
