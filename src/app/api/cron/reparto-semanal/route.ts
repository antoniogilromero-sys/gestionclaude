import { NextRequest, NextResponse } from "next/server";
import { ahoraMadrid, enviarRepartoSemana, lunesSiguiente } from "@/lib/emailReparto";

// Lo llama el cron de Vercel (vercel.json) los domingos. Manda el reparto de
// la semana siguiente a los entrenadores a las 22h hora de Madrid.
//
// Vercel programa el cron en UTC y no entiende de horario de verano: 22h en
// Madrid son las 20h UTC en verano y las 21h UTC en invierno. Por eso
// vercel.json lo dispara a las dos horas y aquí se comprueba que en Madrid
// sean de verdad las 22h de un domingo; si no, no hace nada. (En el plan
// gratuito de Vercel el cron puede llegar en cualquier minuto de esa hora.)
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: "Falta configurar CRON_SECRET" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = ahoraMadrid();
  if (!(ahora.esDomingo && ahora.hora === 22)) {
    return NextResponse.json({ ok: true, saltado: "no es domingo a las 22h en Madrid", ahora });
  }

  const semana = lunesSiguiente(ahora.iso);
  const resultado = await enviarRepartoSemana(semana, { origen: "automatico" });
  if (!resultado.ok) {
    // yaEnviado y sinReparto no son un fallo: el cron puede dispararse dos veces
    // o el director puede no haber hecho el reparto todavía.
    const esperado = resultado.yaEnviado || resultado.sinReparto;
    return NextResponse.json({ ok: Boolean(esperado), semana, aviso: resultado.error }, { status: esperado ? 200 : 500 });
  }
  return NextResponse.json({ ok: true, semana, enviados: resultado.enviados });
}
