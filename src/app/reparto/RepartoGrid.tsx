"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAsignacion, copiarSemanaAnterior } from "./actions";

type Grupo = {
  id: number;
  nombre: string;
  dias: string[];
  hora_inicio: string;
  hora_fin: string;
};
type Entrenador = { id: string; nombre: string };
type Asignacion = { grupo_id: number; entrenador_id: string };

function key(grupoId: number, entrenadorId: string) {
  return `${grupoId}:${entrenadorId}`;
}

function formatSemana(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const inicio = new Date(y, m - 1, d);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  const fmt = (dt: Date) =>
    `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
  return `${fmt(inicio)} – ${fmt(fin)}`;
}

function franjasSolapan(a: Grupo, b: Grupo) {
  const diasComunes = a.dias.some((d) => b.dias.includes(d));
  if (!diasComunes) return false;
  return a.hora_inicio < b.hora_fin && b.hora_inicio < a.hora_fin;
}

export function RepartoGrid({
  semana,
  semanaAnterior,
  semanaSiguiente,
  grupos,
  entrenadores,
  asignacionesIniciales,
}: {
  semana: string;
  semanaAnterior: string;
  semanaSiguiente: string;
  grupos: Grupo[];
  entrenadores: Entrenador[];
  asignacionesIniciales: Asignacion[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [copiando, setCopiando] = useState(false);
  const [avisoCopia, setAvisoCopia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asignado, setAsignado] = useState<Set<string>>(
    () => new Set(asignacionesIniciales.map((a) => key(a.grupo_id, a.entrenador_id))),
  );

  function toggle(grupoId: number, entrenadorId: string) {
    const k = key(grupoId, entrenadorId);
    const yaAsignado = asignado.has(k);
    setError(null);
    setAsignado((prev) => {
      const next = new Set(prev);
      if (yaAsignado) next.delete(k);
      else next.add(k);
      return next;
    });
    startTransition(async () => {
      try {
        await setAsignacion(semana, grupoId, entrenadorId, !yaAsignado);
      } catch (e) {
        setAsignado((prev) => {
          const next = new Set(prev);
          if (yaAsignado) next.add(k);
          else next.delete(k);
          return next;
        });
        setError(e instanceof Error ? e.message : "No se pudo guardar el cambio, inténtalo de nuevo");
      }
    });
  }

  async function copiarAnterior() {
    setCopiando(true);
    setAvisoCopia(null);
    try {
      const resultado = await copiarSemanaAnterior(semana, semanaAnterior);
      if (!resultado.copiado) {
        setAvisoCopia("La semana anterior no tiene reparto guardado, así que no se ha tocado nada.");
      } else {
        router.refresh();
      }
    } finally {
      setCopiando(false);
    }
  }

  const sinEntrenador = grupos.filter(
    (g) => !entrenadores.some((e) => asignado.has(key(g.id, e.id))),
  );
  const solapes: string[] = [];
  for (const e of entrenadores) {
    const gruposDe = grupos.filter((g) => asignado.has(key(g.id, e.id)));
    for (let i = 0; i < gruposDe.length; i++) {
      for (let j = i + 1; j < gruposDe.length; j++) {
        if (franjasSolapan(gruposDe[i], gruposDe[j])) {
          solapes.push(
            `${e.nombre}: ${gruposDe[i].nombre} y ${gruposDe[j].nombre} coinciden en horario`,
          );
        }
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Link
          href={`/reparto?semana=${semanaAnterior}`}
          className="text-mute hover:text-chalk px-2 py-1"
          aria-label="Semana anterior"
        >
          ←
        </Link>
        <div className="font-display text-sm tracking-[.08em] uppercase text-mute">
          Semana del {formatSemana(semana)}
        </div>
        <Link
          href={`/reparto?semana=${semanaSiguiente}`}
          className="text-mute hover:text-chalk px-2 py-1"
          aria-label="Semana siguiente"
        >
          →
        </Link>
      </div>

      <button
        onClick={copiarAnterior}
        disabled={copiando}
        className="w-full bg-transparent border border-edge text-chalk rounded-[9px] py-2.5 font-display text-sm tracking-[.05em] uppercase cursor-pointer mb-4 disabled:opacity-60"
      >
        {copiando ? "Copiando…" : "Copiar reparto de la semana anterior"}
      </button>
      {avisoCopia && <p className="text-mute text-[13px] -mt-2.5 mb-4">{avisoCopia}</p>}
      {error && <p className="text-run text-[13px] -mt-2.5 mb-4">{error}</p>}

      {(sinEntrenador.length > 0 || solapes.length > 0) && (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3 mb-4 space-y-1">
          {sinEntrenador.map((g) => (
            <p key={g.id} className="text-run text-[13px]">
              {g.nombre} se queda sin entrenador
            </p>
          ))}
          {solapes.map((s, i) => (
            <p key={i} className="text-run text-[13px]">
              {s}
            </p>
          ))}
        </div>
      )}

      {grupos.map((g) => (
        <article key={g.id} className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5">
          <h3 className="text-[16px] font-semibold mb-[3px]">{g.nombre}</h3>
          <div className="text-xs text-mute mb-2.5">
            {g.dias.join(" y ")} · {g.hora_inicio.slice(0, 5)}–{g.hora_fin.slice(0, 5)}
          </div>
          <div className="flex flex-wrap gap-[7px]">
            {entrenadores.map((e) => {
              const activo = asignado.has(key(g.id, e.id));
              return (
                <button
                  key={e.id}
                  onClick={() => toggle(g.id, e.id)}
                  aria-pressed={activo}
                  className={`px-[13px] py-2 rounded-full border text-[13px] cursor-pointer select-none ${
                    activo
                      ? "bg-signal text-[#160800] border-signal font-semibold"
                      : "bg-deep text-mute border-edge"
                  }`}
                >
                  {e.nombre}
                </button>
              );
            })}
            {entrenadores.length === 0 && (
              <p className="text-mute text-[13px]">No hay entrenadores aprobados todavía.</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
