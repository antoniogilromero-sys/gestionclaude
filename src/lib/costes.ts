// Cálculo de coste de entrenadores, compartido entre /reparto y /pagos
// para que las dos pantallas usen siempre la misma tarifa y las mismas
// horas — si algún día cambia una tarifa general, se cambia aquí una vez.

// Sin excepción propia en tarifas_entrenador, se paga esto por hora.
// "fuerza" a 15 €/h confirmado por Antón (no salía de ningún cálculo).
export const TARIFA_GENERAL: Record<string, number> = {
  natacion: 15,
  carrera: 15,
  ciclismo: 20,
  fuerza: 15,
};

export type Grupo = {
  id: number;
  nombre: string;
  disciplina: string;
  dias: string[];
  hora_inicio: string | null;
  hora_fin: string | null;
  orden?: number | null;
};

export type Tarifa = { entrenador_id: string; disciplina: string; euros_hora: number };

// Grupos que Antón pidió explícitamente dejar a 0€/hora para quien sea
// que los cubra, sin excepción de entrenador — no es una tarifa general
// ni una tarifa por entrenador, es una tarifa por GRUPO concreto (algo
// que hasta ahora no hacía falta modelar). Comparación en minúsculas
// para no depender de que el nombre esté escrito con las mayúsculas
// exactas en la base de datos.
const GRUPOS_SIN_PAGO = new Set(["martes avanzado 19h", "jueves avanzado 19h"]);

// Excepción más amplia que GRUPOS_SIN_PAGO: aquí no es "este grupo no
// se paga a nadie", es "a esta persona no se le paga NINGÚN grupo que
// dé en este día" — otro entrenador que cubra el mismo grupo ese mismo
// día sí cobra lo normal. Pedido por Antón: Diego Gil Gordillo no cobra
// ningún lunes, sea cual sea el grupo (empezó siendo solo Atletismo
// 1A/1B, pero pidió ampliarlo a "todo lo del lunes").
const ENTRENADOR_DIA_SIN_PAGO = [{ entrenador: "diego gil gordillo", dia: "lunes" }];

export function tarifaDe(
  entrenadorId: string,
  disciplina: string,
  tarifas: Tarifa[],
  nombreGrupo?: string,
  nombreEntrenador?: string,
  diasGrupo?: string[],
) {
  // Colapsa espacios de más además de mayúsculas — "Diego Gil  Gordillo"
  // (con doble espacio, que es justo el fallo que ya dio problemas en
  // Deportistas) tiene que seguir encajando con "Diego Gil Gordillo".
  const normaliza = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const grupoClave = nombreGrupo ? normaliza(nombreGrupo) : undefined;
  const entrenadorClave = nombreEntrenador ? normaliza(nombreEntrenador) : undefined;
  const diasClave = (diasGrupo ?? []).map((d) => normaliza(d));

  if (grupoClave && GRUPOS_SIN_PAGO.has(grupoClave)) return 0;
  if (
    entrenadorClave &&
    diasClave.some((d) =>
      ENTRENADOR_DIA_SIN_PAGO.some((x) => x.entrenador === entrenadorClave && x.dia === d),
    )
  ) {
    return 0;
  }

  const propia = tarifas.find(
    (t) => t.entrenador_id === entrenadorId && t.disciplina === disciplina,
  );
  if (propia) return propia.euros_hora;
  return TARIFA_GENERAL[disciplina] ?? null;
}

// Duración de una sola sesión (una franja horaria concreta), en horas. Un
// grupo sin horario fijo (ej. Ciclismo Carretera del domingo) devuelve
// null: no se puede calcular su coste hasta que tenga horas.
function duracionHoras(horaInicio: string | null, horaFin: string | null): number | null {
  if (!horaInicio || !horaFin) return null;
  const [h1, m1] = horaInicio.split(":").map(Number);
  const [h2, m2] = horaFin.split(":").map(Number);
  return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
}

export const DISCIPLINA_LABEL: Record<string, string> = {
  natacion: "Natación",
  carrera: "Carrera",
  ciclismo: "Ciclismo",
  fuerza: "Fuerza",
};

export const DISCIPLINA_TAG: Record<string, string> = {
  natacion: "bg-swim/15 text-swim",
  carrera: "bg-run/15 text-run",
  ciclismo: "bg-bike/15 text-bike",
  fuerza: "bg-signal/15 text-signal",
};

export type Asignacion = { grupo_id: number; entrenador_id: string };
export type EntrenadorConNombre = { id: string; nombre: string };

// Para un conjunto de asignaciones de UNA semana, cuánto le corresponde
// a cada entrenador — compartido entre /reparto y /pagos para que las
// dos pantallas calculen exactamente igual (misma tarifa, mismas horas,
// mismas excepciones de grupo/entrenador a 0€).
//
// Un entrenador puede tener asignados dos grupos distintos (ej. "Martes
// Avanzado 19h" y "Martes Medio 19h") que en la práctica son un único
// entrenamiento que él da a la vez a dos niveles — Antón confirmó
// explícitamente (septiembre 2026) que eso cuenta como UNA sola hora de
// trabajo, no dos. Por eso el cálculo no suma grupo a grupo: primero
// abre cada grupo en sus sesiones sueltas (una por día que entrena), y
// solo cuenta una vez cada franja horaria exacta (mismo día + misma
// hora de inicio y fin) en la que el entrenador tenga varios grupos a
// la vez. Si dos grupos coinciden en día pero NO en horario (ej. uno a
// las 19h y otro a las 20h), siguen contando como dos entrenamientos
// distintos.
export function calcularFilas(
  grupos: Grupo[],
  entrenadores: EntrenadorConNombre[],
  asignaciones: Asignacion[],
  tarifas: Tarifa[],
) {
  return entrenadores.map((e) => {
    const gruposDe = grupos.filter((g) =>
      asignaciones.some((a) => a.grupo_id === g.id && a.entrenador_id === e.id),
    );

    type Sesion = {
      disciplina: string;
      horas: number | null;
      tarifa: number | null;
    };
    const sesionesPorFranja = new Map<string, Sesion[]>();
    for (const g of gruposDe) {
      const horas = duracionHoras(g.hora_inicio, g.hora_fin);
      for (const dia of g.dias) {
        // La tarifa se calcula día a día (no para todo el grupo de
        // golpe): un grupo que diera lunes Y otro día no debería perder
        // el cobro entero solo porque el lunes esté exento.
        const tarifa = tarifaDe(e.id, g.disciplina, tarifas, g.nombre, e.nombre, [dia]);
        const clave = `${dia}|${g.hora_inicio ?? ""}|${g.hora_fin ?? ""}`;
        const lista = sesionesPorFranja.get(clave) ?? [];
        lista.push({ disciplina: g.disciplina, horas, tarifa });
        sesionesPorFranja.set(clave, lista);
      }
    }

    const porDisciplina: Record<string, number> = {};
    let coste = 0;
    let completo = true;
    for (const sesiones of sesionesPorFranja.values()) {
      const validas = sesiones.filter(
        (s): s is Sesion & { horas: number; tarifa: number } => s.horas != null && s.tarifa != null,
      );
      if (validas.length === 0) {
        completo = false;
        continue;
      }
      // De varios grupos a la misma hora, se paga solo uno (el de mayor
      // coste, para no perder nunca un cobro por casualidad del orden).
      const elegida = validas.reduce((mejor, s) =>
        s.horas * s.tarifa > mejor.horas * mejor.tarifa ? s : mejor,
      );
      porDisciplina[elegida.disciplina] = (porDisciplina[elegida.disciplina] ?? 0) + elegida.horas;
      coste += elegida.horas * elegida.tarifa;
    }
    return { entrenador: e, porDisciplina, coste, completo };
  });
}
