"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAsignacion, copiarSemanaAnterior } from "./actions";
import {
  tarifaDe,
  horasSemanales,
  DISCIPLINA_LABEL,
  DISCIPLINA_TAG,
  type Grupo,
  type Tarifa,
} from "@/lib/costes";

type Entrenador = { id: string; nombre: string };
type Asignacion = { grupo_id: number; entrenador_id: string };

function key(grupoId: number, entrenadorId: string) {
  return `${grupoId}:${entrenadorId}`;
}

const DIA_ORDEN: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 7,
};
const DIA_LABEL: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

// El día "principal" de un grupo es el primero de la semana en el que
// entrena (los grupos que van martes y jueves salen bajo el martes).
function diaPrincipal(g: Grupo) {
  const idx = g.dias.map((d) => DIA_ORDEN[d] ?? 99);
  return idx.length ? Math.min(...idx) : 99;
}

function ordenarGrupos(a: Grupo, b: Grupo) {
  const da = diaPrincipal(a);
  const db = diaPrincipal(b);
  if (da !== db) return da - db;
  const ha = a.hora_inicio ?? "99:99";
  const hb = b.hora_inicio ?? "99:99";
  if (ha !== hb) return ha < hb ? -1 : 1;
  return (a.orden ?? 9999) - (b.orden ?? 9999) || a.id - b.id;
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

export function RepartoGrid({
  esDirector,
  semana,
  semanaAnterior,
  semanaSiguiente,
  puedeAvanzar,
  grupos,
  entrenadores,
  asignacionesIniciales,
  tarifas,
}: {
  esDirector: boolean;
  semana: string;
  semanaAnterior: string;
  semanaSiguiente: string;
  puedeAvanzar: boolean;
  grupos: Grupo[];
  entrenadores: Entrenador[];
  asignacionesIniciales: Asignacion[];
  tarifas: Tarifa[];
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

  const sinEquipo = entrenadores.length === 0;

  // Los grupos se muestran por día de la semana (Lunes → Domingo), y
  // dentro de cada día por hora. El deporte va como etiqueta en cada
  // grupo, no como sección.
  const gruposOrdenados = [...grupos].sort(ordenarGrupos);
  const porDia: { clave: number; label: string; grupos: Grupo[] }[] = [];
  for (const g of gruposOrdenados) {
    const clave = diaPrincipal(g);
    const nombreDia = g.dias.find((d) => (DIA_ORDEN[d] ?? 99) === clave) ?? "";
    const label = DIA_LABEL[nombreDia] ?? "Sin día fijo";
    const ultimo = porDia[porDia.length - 1];
    if (ultimo && ultimo.clave === clave) ultimo.grupos.push(g);
    else porDia.push({ clave, label, grupos: [g] });
  }

  return (
    <div>
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
        {puedeAvanzar ? (
          <Link
            href={`/reparto?semana=${semanaSiguiente}`}
            className="text-mute hover:text-chalk px-2 py-1"
            aria-label="Semana siguiente"
          >
            →
          </Link>
        ) : (
          <span
            className="text-edge px-2 py-1 select-none"
            aria-hidden="true"
            title="El reparto de la semana que viene se abre el sábado anterior"
          >
            →
          </span>
        )}
      </div>
      {!puedeAvanzar && !esDirector && (
        <p className="text-mute text-[12px] text-center -mt-1.5 mb-3">
          El reparto de la semana siguiente se abre el sábado anterior.
        </p>
      )}

      {esDirector && (
        <>
          <button
            onClick={copiarAnterior}
            disabled={copiando}
            className="w-full bg-transparent border border-edge text-chalk rounded-[9px] py-2.5 font-display text-sm tracking-[.05em] uppercase cursor-pointer mb-4 disabled:opacity-60"
          >
            {copiando ? "Copiando…" : "Copiar reparto de la semana anterior"}
          </button>
          {avisoCopia && <p className="text-mute text-[13px] -mt-2.5 mb-4">{avisoCopia}</p>}
          {error && <p className="text-run text-[13px] -mt-2.5 mb-4">{error}</p>}
        </>
      )}

      {!sinEquipo && sinEntrenador.length > 0 && (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3 mb-4 space-y-1">
          {sinEntrenador.map((g) => (
            <p key={g.id} className="text-run text-[13px]">
              {g.nombre} se queda sin entrenador
            </p>
          ))}
        </div>
      )}

      {porDia.map((bloque) => (
        <div key={bloque.clave} className="mb-4">
          <h2 className="font-display text-[13px] tracking-[.12em] uppercase text-mute mb-2">
            {bloque.label}
          </h2>
          {bloque.grupos.map((g) => {
            const asignadosDelGrupo = entrenadores.filter((e) =>
              asignado.has(key(g.id, e.id)),
            );
            return (
              <article key={g.id} className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5">
                <div className="flex items-center gap-2 mb-[3px] flex-wrap">
                  <h3 className="text-[16px] font-semibold">{g.nombre}</h3>
                  <span
                    className={`px-[7px] py-[2px] rounded-[5px] text-[11px] font-display tracking-[.06em] uppercase ${
                      DISCIPLINA_TAG[g.disciplina] ?? "bg-edge text-chalk"
                    }`}
                  >
                    {DISCIPLINA_LABEL[g.disciplina] ?? g.disciplina}
                  </span>
                </div>
                <div className="text-xs text-mute mb-2.5">
                  {g.dias.join(" y ")} ·{" "}
                  {g.hora_inicio && g.hora_fin
                    ? `${g.hora_inicio.slice(0, 5)}–${g.hora_fin.slice(0, 5)}`
                    : "horario variable"}
                </div>
                <div className="flex flex-wrap gap-[7px]">
                  {!esDirector ? (
                    // Solo lectura: el entrenador ve solo quién va a este
                    // grupo (para la logística), no la lista entera.
                    asignadosDelGrupo.length > 0 ? (
                      asignadosDelGrupo.map((e) => (
                        <span
                          key={e.id}
                          className="min-h-[44px] px-4 rounded-full border text-[14px] flex items-center select-none bg-signal text-[#160800] border-signal font-semibold"
                        >
                          {e.nombre}
                        </span>
                      ))
                    ) : (
                      <span className="text-[13px] text-mute italic py-2">
                        Sin entrenador asignado
                      </span>
                    )
                  ) : (
                    entrenadores.map((e) => {
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
                    })
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ))}

      {esDirector && (
        <CosteSemanal grupos={grupos} entrenadores={entrenadores} asignado={asignado} tarifas={tarifas} />
      )}
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
        const t = tarifaDe(e.id, g.disciplina, tarifas, g.nombre, e.nombre);
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
