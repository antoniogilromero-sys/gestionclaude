"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAsignacion, copiarSemanaAnterior } from "./actions";

type Grupo = {
  id: number;
  nombre: string;
  disciplina: string;
  dias: string[];
  hora_inicio: string | null;
  hora_fin: string | null;
};
type Entrenador = { id: string; nombre: string };
type Asignacion = { grupo_id: number; entrenador_id: string };
type Tarifa = { entrenador_id: string; disciplina: string; euros_hora: number };
type PersonalTemporada = {
  nombre: string;
  email: string;
  telefono: string | null;
  registrado: boolean;
};

const TARIFA_GENERAL: Record<string, number> = {
  natacion: 15,
  carrera: 15,
  ciclismo: 20,
};

const DISCIPLINA_LABEL: Record<string, string> = {
  natacion: "Natación",
  carrera: "Carrera",
  ciclismo: "Ciclismo",
};

const DISCIPLINA_TAG: Record<string, string> = {
  natacion: "bg-swim/15 text-swim",
  carrera: "bg-run/15 text-run",
  ciclismo: "bg-bike/15 text-bike",
};

const ORDEN_DIAS = ["lunes", "martes", "miercoles", "miércoles", "jueves", "viernes", "sabado", "sábado", "domingo"];

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
  if (!a.hora_inicio || !a.hora_fin || !b.hora_inicio || !b.hora_fin) return false;
  const diasComunes = a.dias.some((d) => b.dias.includes(d));
  if (!diasComunes) return false;
  return a.hora_inicio < b.hora_fin && b.hora_inicio < a.hora_fin;
}

function horasSemanales(g: Grupo) {
  if (!g.hora_inicio || !g.hora_fin) return null;
  const [h1, m1] = g.hora_inicio.split(":").map(Number);
  const [h2, m2] = g.hora_fin.split(":").map(Number);
  const horasPorSesion = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
  return horasPorSesion * g.dias.length;
}

function tarifaDe(entrenadorId: string, disciplina: string, tarifas: Tarifa[]) {
  const propia = tarifas.find((t) => t.entrenador_id === entrenadorId && t.disciplina === disciplina);
  if (propia) return propia.euros_hora;
  return TARIFA_GENERAL[disciplina] ?? null;
}

export function RepartoGrid({
  semana,
  semanaAnterior,
  semanaSiguiente,
  grupos,
  entrenadores,
  asignacionesIniciales,
  tarifas,
  personal,
}: {
  semana: string;
  semanaAnterior: string;
  semanaSiguiente: string;
  grupos: Grupo[];
  entrenadores: Entrenador[];
  asignacionesIniciales: Asignacion[];
  tarifas: Tarifa[];
  personal: PersonalTemporada[];
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
      const resultado = await setAsignacion(semana, grupoId, entrenadorId, !yaAsignado);
      if ("error" in resultado) {
        setAsignado((prev) => {
          const next = new Set(prev);
          if (yaAsignado) next.add(k);
          else next.delete(k);
          return next;
        });
        setError(resultado.error);
      }
    });
  }

  async function copiarAnterior() {
    setCopiando(true);
    setAvisoCopia(null);
    setError(null);
    const resultado = await copiarSemanaAnterior(semana, semanaAnterior);
    if ("error" in resultado) {
      setError(resultado.error);
    } else if (!resultado.copiado) {
      setAvisoCopia("La semana anterior no tiene reparto guardado, así que no se ha tocado nada.");
    } else {
      router.refresh();
    }
    setCopiando(false);
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

  const disciplinas = [...new Set(grupos.map((g) => g.disciplina))];
  const sinEquipo = entrenadores.length === 0;

  return (
    <div>
      <CuadroPersonal personal={personal} />

      {sinEquipo && (
        <div className="bg-surf border border-signal/40 rounded-[10px] p-3.5 mb-4">
          <b className="block text-[15px] font-medium mb-1">
            Todavía no puedes repartir grupos
          </b>
          <p className="text-sm text-mute leading-relaxed">
            No hay ningún entrenador dado de alta en la aplicación. Cada
            entrenador tiene que entrar una vez con su correo o su cuenta de
            Google, y luego tú lo apruebas en{" "}
            <Link href="/equipo" className="text-signal underline">
              Equipo
            </Link>
            . A partir de ahí aparecerán aquí para asignarles grupos.
          </p>
        </div>
      )}

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

      <ResumenSemanaVisual grupos={grupos} entrenadores={entrenadores} asignado={asignado} />

      <button
        onClick={copiarAnterior}
        disabled={copiando}
        className="w-full bg-transparent border border-edge text-chalk rounded-[9px] py-2.5 font-display text-sm tracking-[.05em] uppercase cursor-pointer mb-4 disabled:opacity-60"
      >
        {copiando ? "Copiando…" : "Copiar reparto de la semana anterior"}
      </button>
      {avisoCopia && <p className="text-mute text-[13px] -mt-2.5 mb-4">{avisoCopia}</p>}
      {error && <p className="text-run text-[13px] -mt-2.5 mb-4">{error}</p>}

      {!sinEquipo && (sinEntrenador.length > 0 || solapes.length > 0) && (
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

      {disciplinas.map((disc) => (
        <div key={disc} className="mb-4">
          <h2 className="font-display text-[13px] tracking-[.12em] uppercase text-mute mb-2 flex items-center gap-2">
            <span className={`px-[7px] py-[2px] rounded-[5px] ${DISCIPLINA_TAG[disc] ?? "bg-edge text-chalk"}`}>
              {DISCIPLINA_LABEL[disc] ?? disc}
            </span>
          </h2>
          {grupos
            .filter((g) => g.disciplina === disc)
            .map((g) => (
              <article key={g.id} className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5">
                <h3 className="text-[16px] font-semibold mb-[3px]">{g.nombre}</h3>
                <div className="text-xs text-mute mb-2.5">
                  {g.dias.join(" y ")} ·{" "}
                  {g.hora_inicio && g.hora_fin
                    ? `${g.hora_inicio.slice(0, 5)}–${g.hora_fin.slice(0, 5)}`
                    : "horario variable"}
                </div>
                <div className="flex flex-wrap gap-[7px]">
                  {entrenadores.map((e) => {
                    const activo = asignado.has(key(g.id, e.id));
                    return (
                      <button
                        key={e.id}
                        onClick={() => toggle(g.id, e.id)}
                        aria-pressed={activo}
                        className={`min-h-[44px] px-4 rounded-full border text-[14px] cursor-pointer select-none ${
                          activo
                            ? "bg-signal text-[#160800] border-signal font-semibold"
                            : "bg-deep text-mute border-edge"
                        }`}
                      >
                        {e.nombre}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
        </div>
      ))}

      <CosteSemanal grupos={grupos} entrenadores={entrenadores} asignado={asignado} tarifas={tarifas} />
    </div>
  );
}

function capitaliza(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function ResumenSemanaVisual({
  grupos,
  entrenadores,
  asignado,
}: {
  grupos: Grupo[];
  entrenadores: Entrenador[];
  asignado: Set<string>;
}) {
  const diasUsados = ORDEN_DIAS.filter((d) => grupos.some((g) => g.dias.includes(d))).filter(
    (d, i, arr) => arr.indexOf(d) === i,
  );

  if (diasUsados.length === 0) return null;

  return (
    <div className="mb-4">
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Resumen visual de la semana
      </h2>
      <div className="grid gap-2.5">
        {diasUsados.map((dia) => {
          const gruposDia = grupos
            .filter((g) => g.dias.includes(dia))
            .sort((a, b) => (a.hora_inicio ?? "99:99").localeCompare(b.hora_inicio ?? "99:99"));

          return (
            <div key={dia} className="bg-surf border border-edge rounded-[10px] p-3">
              <h3 className="font-display text-[13px] tracking-[.1em] uppercase text-signal mb-2">
                {capitaliza(dia)}
              </h3>
              <div className="space-y-1.5">
                {gruposDia.map((g) => {
                  const asignados = entrenadores.filter((e) => asignado.has(key(g.id, e.id)));
                  return (
                    <div key={g.id} className="flex items-center gap-2 text-[13px]">
                      <span className="font-display text-mute w-[70px] shrink-0 tabular-nums">
                        {g.hora_inicio && g.hora_fin
                          ? `${g.hora_inicio.slice(0, 5)}–${g.hora_fin.slice(0, 5)}`
                          : "variable"}
                      </span>
                      <span
                        className={`shrink-0 px-[7px] py-[2px] rounded-[5px] text-xs ${DISCIPLINA_TAG[g.disciplina] ?? "bg-edge text-chalk"}`}
                      >
                        {g.nombre}
                      </span>
                      {asignados.length > 0 ? (
                        <span className="text-chalk font-medium truncate">
                          {asignados.map((e) => e.nombre).join(" · ")}
                        </span>
                      ) : (
                        <span className="text-run">Sin asignar</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CuadroPersonal({ personal }: { personal: PersonalTemporada[] }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Cuadro de personal · 26/27
      </h2>
      <div className="flex flex-col gap-[7px]">
        {personal.map((p) => (
          <div
            key={p.email}
            className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[10px] border ${
              p.registrado ? "border-ok/50 bg-surf" : "border-edge bg-surf"
            }`}
          >
            <div className="min-w-0">
              <b className="text-[14px] block truncate">{p.nombre}</b>
              <span className="text-xs text-mute block truncate">
                {p.email}
                {p.telefono && ` · ${p.telefono}`}
              </span>
            </div>
            <span
              className={`shrink-0 font-display text-[11px] tracking-[.05em] uppercase px-2 py-1 rounded-full ${
                p.registrado ? "bg-ok/15 text-ok" : "bg-edge text-mute"
              }`}
            >
              {p.registrado ? "En el equipo" : "Sin cuenta"}
            </span>
          </div>
        ))}
        {personal.length === 0 && (
          <p className="text-mute text-sm">Sin plantilla cargada todavía.</p>
        )}
      </div>
    </div>
  );
}

function CosteSemanal({
  grupos,
  entrenadores,
  asignado,
  tarifas,
}: {
  grupos: Grupo[];
  entrenadores: Entrenador[];
  asignado: Set<string>;
  tarifas: Tarifa[];
}) {
  const filas = entrenadores
    .map((e) => {
      const gruposDe = grupos.filter((g) => asignado.has(key(g.id, e.id)));
      let horas = 0;
      let coste = 0;
      let completo = true;
      for (const g of gruposDe) {
        const h = horasSemanales(g);
        const t = tarifaDe(e.id, g.disciplina, tarifas);
        if (h == null || t == null) {
          completo = false;
          continue;
        }
        horas += h;
        coste += h * t;
      }
      return { entrenador: e.nombre, horas, coste, completo };
    })
    .filter((f) => f.horas > 0 || f.coste > 0);

  const huboIncompletos = filas.some((f) => !f.completo);
  const totalHoras = filas.reduce((s, f) => s + f.horas, 0);
  const totalCoste = filas.reduce((s, f) => s + f.coste, 0);

  if (filas.length === 0) return null;

  return (
    <div className="mt-2">
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Coste semanal
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="text-left font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
                Entrenador
              </th>
              <th className="text-right font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
                Horas
              </th>
              <th className="text-right font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
                Coste
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.entrenador}>
                <td className="py-[9px] px-1.5 border-b border-edge/50">{f.entrenador}</td>
                <td className="font-display text-right py-[9px] px-1.5 border-b border-edge/50">
                  {f.horas}
                  {!f.completo && "*"}
                </td>
                <td className="font-display text-right py-[9px] px-1.5 border-b border-edge/50">
                  {f.coste.toFixed(2)} €{!f.completo && "*"}
                </td>
              </tr>
            ))}
            <tr>
              <td className="py-[9px] px-1.5 font-semibold">Total</td>
              <td className="font-display text-right py-[9px] px-1.5 font-semibold">{totalHoras}</td>
              <td className="font-display text-right py-[9px] px-1.5 font-semibold">
                {totalCoste.toFixed(2)} €
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {huboIncompletos && (
        <p className="text-xs text-mute mt-2">
          * Algún grupo de este entrenador no tiene horario fijo (por ejemplo, ciclismo de
          carretera), así que no entra en el cálculo hasta que se sepa cuánto dura.
        </p>
      )}
    </div>
  );
}
