import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

// Correo del reparto semanal a los entrenadores. Lo manda el cron de los
// domingos a las 22h (src/app/api/cron/reparto-semanal) o el director a mano
// desde /reparto. Solo lleva el HORARIO (quién da cada grupo), nunca coste ni
// datos de contacto: es lo mismo que ve un entrenador en /reparto.
//
// Necesita en Vercel: GMAIL_USER y GMAIL_APP_PASSWORD (contraseña de
// aplicación de Google, no la contraseña normal).

const DIAS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};
const ORDEN_DIA = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const DISCIPLINA: Record<string, string> = {
  natacion: "Natación",
  carrera: "Carrera",
  ciclismo: "Ciclismo",
  fuerza: "Fuerza",
};

type Grupo = {
  id: number;
  nombre: string;
  disciplina: string;
  dias: string[];
  hora_inicio: string | null;
  hora_fin: string | null;
  orden: number | null;
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function hora(g: Grupo) {
  if (!g.hora_inicio) return "sin horario fijo";
  const ini = g.hora_inicio.slice(0, 5);
  return g.hora_fin ? `${ini}–${g.hora_fin.slice(0, 5)}` : ini;
}
function fechaCorta(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}/${m}/${y}`;
}
function sumarDias(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(Date.UTC(y, m - 1, d + n));
  return f.toISOString().slice(0, 10);
}

// Fecha y hora actuales en Madrid (el cron de Vercel va en UTC).
export function ahoraMadrid(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(fecha);
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return {
    iso: `${get("year")}-${get("month")}-${get("day")}`,
    hora: Number(get("hour")) % 24,
    esDomingo: get("weekday") === "Sun",
  };
}

// Lunes de la semana SIGUIENTE a la fecha dada (un domingo → el día después).
export function lunesSiguiente(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dia = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
  const hastaLunes = dia === 0 ? 1 : 8 - dia;
  return sumarDias(iso, hastaLunes);
}

export type ResultadoEnvio =
  | { ok: true; enviados: number; destinatarios: string[] }
  | { ok: false; error: string; yaEnviado?: boolean; sinReparto?: boolean };

export async function enviarRepartoSemana(
  semana: string,
  opciones: { origen: "automatico" | "manual"; permitirReenvio?: boolean },
): Promise<ResultadoEnvio> {
  const usuario = process.env.GMAIL_USER;
  const clave = process.env.GMAIL_APP_PASSWORD;
  if (!usuario || !clave) {
    return {
      ok: false,
      error: "Faltan GMAIL_USER y GMAIL_APP_PASSWORD en las variables de entorno de Vercel.",
    };
  }

  const supabase = createAdminClient();

  if (!opciones.permitirReenvio) {
    const { data: previo } = await supabase
      .from("envios_reparto")
      .select("enviado_en")
      .eq("semana", semana)
      .maybeSingle();
    if (previo) {
      return { ok: false, yaEnviado: true, error: `El reparto de la semana del ${fechaCorta(semana)} ya se envió.` };
    }
  }

  const [{ data: grupos }, { data: asignaciones }, { data: perfiles }] = await Promise.all([
    supabase
      .from("grupos")
      .select("id, nombre, disciplina, dias, hora_inicio, hora_fin, orden")
      .eq("activo", true)
      .order("orden")
      .order("id"),
    supabase.from("asignaciones").select("grupo_id, entrenador_id").eq("semana", semana),
    supabase
      .from("perfiles")
      .select("id, nombre, email, rol")
      .in("rol", ["director", "entrenador"])
      .eq("activo", true),
  ]);

  if (!asignaciones || asignaciones.length === 0) {
    return {
      ok: false,
      sinReparto: true,
      error: `No hay reparto guardado para la semana del ${fechaCorta(semana)}.`,
    };
  }

  const nombreDe = new Map(
    (perfiles ?? []).map((p) => [p.id as string, (p.nombre as string) || (p.email as string).split("@")[0]]),
  );
  const gruposAll = (grupos ?? []) as Grupo[];

  const quienPorGrupo = new Map<number, string[]>();
  const gruposPorEntrenador = new Map<string, number[]>();
  for (const a of asignaciones) {
    const nombre = nombreDe.get(a.entrenador_id as string);
    if (nombre) {
      quienPorGrupo.set(a.grupo_id, [...(quienPorGrupo.get(a.grupo_id) ?? []), nombre]);
    }
    gruposPorEntrenador.set(a.entrenador_id as string, [
      ...(gruposPorEntrenador.get(a.entrenador_id as string) ?? []),
      a.grupo_id,
    ]);
  }

  const gruposConReparto = gruposAll.filter((g) => quienPorGrupo.has(g.id) || g.dias.length > 0);
  const sinEntrenador = gruposAll.filter((g) => !quienPorGrupo.has(g.id));

  // Sesiones por día: un grupo que entrena martes y jueves sale en los dos.
  type Sesion = { grupo: Grupo; quien: string[] };
  const porDia = new Map<string, Sesion[]>();
  for (const g of gruposConReparto) {
    for (const dia of g.dias) {
      const lista = porDia.get(dia) ?? [];
      lista.push({ grupo: g, quien: quienPorGrupo.get(g.id) ?? [] });
      porDia.set(dia, lista);
    }
  }
  const ordenHora = (a: Sesion, b: Sesion) =>
    (a.grupo.hora_inicio ?? "99:99").localeCompare(b.grupo.hora_inicio ?? "99:99");

  const fin = sumarDias(semana, 6);
  const asunto = `Reparto de la semana del ${fechaCorta(semana)} al ${fechaCorta(fin)}`;

  const tablaHtml = ORDEN_DIA.filter((d) => porDia.has(d))
    .map((d) => {
      const filas = (porDia.get(d) ?? [])
        .sort(ordenHora)
        .map(
          (s) =>
            `<tr><td style="padding:5px 10px 5px 0;white-space:nowrap;color:#555">${esc(hora(s.grupo))}</td>` +
            `<td style="padding:5px 10px 5px 0"><b>${esc(s.grupo.nombre)}</b> <span style="color:#777;font-size:12px">${esc(DISCIPLINA[s.grupo.disciplina] ?? s.grupo.disciplina)}</span></td>` +
            `<td style="padding:5px 0">${s.quien.length ? esc(s.quien.join(", ")) : '<i style="color:#c0392b">sin entrenador</i>'}</td></tr>`,
        )
        .join("");
      return `<h3 style="margin:16px 0 4px;font-size:15px">${DIAS[d] ?? d}</h3><table style="border-collapse:collapse;font-size:14px">${filas}</table>`;
    })
    .join("");

  const tablaTexto = ORDEN_DIA.filter((d) => porDia.has(d))
    .map((d) => {
      const filas = (porDia.get(d) ?? [])
        .sort(ordenHora)
        .map((s) => `  ${hora(s.grupo)}  ${s.grupo.nombre}: ${s.quien.length ? s.quien.join(", ") : "SIN ENTRENADOR"}`)
        .join("\n");
      return `${DIAS[d] ?? d}\n${filas}`;
    })
    .join("\n\n");

  const destinatarios = (perfiles ?? []).filter((p) => p.email);
  const transporte = nodemailer.createTransport({ service: "gmail", auth: { user: usuario, pass: clave } });

  const enviadosA: string[] = [];
  for (const p of destinatarios) {
    const mios = (gruposPorEntrenador.get(p.id as string) ?? [])
      .map((id) => gruposAll.find((g) => g.id === id))
      .filter((g): g is Grupo => Boolean(g));
    const misSesiones: string[] = [];
    for (const g of mios) {
      for (const d of g.dias) misSesiones.push(`${DIAS[d] ?? d} ${hora(g)} · ${g.nombre}`);
    }
    const nombre = ((p.nombre as string) || "").split(" ")[0] || "equipo";
    const miBloqueHtml =
      mios.length > 0
        ? `<p style="margin:12px 0 4px"><b>Tus grupos esta semana</b></p><ul style="margin:0 0 8px;padding-left:18px;font-size:14px">${misSesiones.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`
        : `<p style="margin:12px 0;font-size:14px;color:#555">Esta semana no tienes grupos asignados.</p>`;
    const miBloqueTexto =
      mios.length > 0
        ? `TUS GRUPOS ESTA SEMANA\n${misSesiones.map((t) => `  - ${t}`).join("\n")}\n\n`
        : "Esta semana no tienes grupos asignados.\n\n";

    const html =
      `<div style="font-family:Arial,sans-serif;color:#222;max-width:560px">` +
      `<p>Hola ${esc(nombre)},</p><p>Este es el reparto de entrenamientos de la semana del <b>${fechaCorta(semana)}</b> al <b>${fechaCorta(fin)}</b>.</p>` +
      miBloqueHtml +
      `<h2 style="margin:18px 0 0;font-size:17px">Reparto completo</h2>${tablaHtml}` +
      (sinEntrenador.some((g) => g.dias.length > 0)
        ? `<p style="margin-top:16px;font-size:13px;color:#c0392b">Grupos sin entrenador asignado: ${esc(sinEntrenador.filter((g) => g.dias.length > 0).map((g) => g.nombre).join(", "))}.</p>`
        : "") +
      `<p style="margin-top:20px;font-size:13px;color:#777">Puedes verlo siempre en https://triatlonalpedrete.vercel.app/reparto<br>C.D.E. Triatlón Alpedrete</p></div>`;
    const texto =
      `Hola ${nombre},\n\nEste es el reparto de entrenamientos de la semana del ${fechaCorta(semana)} al ${fechaCorta(fin)}.\n\n` +
      miBloqueTexto +
      `REPARTO COMPLETO\n\n${tablaTexto}\n\nVerlo siempre: https://triatlonalpedrete.vercel.app/reparto\nC.D.E. Triatlón Alpedrete\n`;

    try {
      await transporte.sendMail({
        from: `"C.D.E. Triatlón Alpedrete" <${usuario}>`,
        to: p.email as string,
        subject: asunto,
        text: texto,
        html,
      });
      enviadosA.push(p.email as string);
    } catch (e) {
      console.error("Fallo al enviar el reparto a", p.email, e);
    }
  }

  if (enviadosA.length === 0) {
    return { ok: false, error: "No se ha podido enviar a nadie. Revisa GMAIL_USER y GMAIL_APP_PASSWORD." };
  }

  await supabase.from("envios_reparto").upsert({
    semana,
    enviado_en: new Date().toISOString(),
    destinatarios: enviadosA.length,
    origen: opciones.origen,
  });

  return { ok: true, enviados: enviadosA.length, destinatarios: enviadosA };
}
