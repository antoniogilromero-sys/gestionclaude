import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { intercambiarCodigoPorToken } from "@/lib/strava";

// A esta ruta redirige Strava después de que un deportista autorice el
// acceso desde /strava-conectar/[id]. No hay sesión de usuario: el
// `state` que se manda al pedir la autorización es el id del deportista,
// y así sabemos a quién ligar el token que devuelve Strava.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const deportistaId = Number(params.get("state"));
  const code = params.get("code");
  const errorStrava = params.get("error");

  if (!deportistaId) {
    return NextResponse.json({ error: "Enlace inválido: falta el deportista" }, { status: 400 });
  }
  if (errorStrava || !code) {
    console.error("Strava callback: sin code o denegado por el usuario", { deportistaId, errorStrava });
    return NextResponse.redirect(new URL(`/strava-conectar/${deportistaId}?error=denegado`, request.url));
  }

  function urlError(codigo: string, err: unknown) {
    console.error(`Strava callback (${codigo}):`, err);
    const url = new URL(`/strava-conectar/${deportistaId}`, request.url);
    url.searchParams.set("error", codigo);
    // El texto que devuelve Strava no incluye el client_secret, solo dice
    // por qué ha rechazado la petición (ej. "invalid client_secret",
    // "invalid code") — se muestra en la pantalla del deportista para no
    // depender de que Antón entre a mirar los logs de Vercel.
    const detalle = err instanceof Error ? err.message : String(err);
    url.searchParams.set("detalle", detalle.slice(0, 300));
    return NextResponse.redirect(url);
  }

  let token;
  try {
    token = await intercambiarCodigoPorToken(code);
  } catch (err) {
    return urlError("token", err);
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("strava_conexiones").upsert({
      deportista_id: deportistaId,
      strava_atleta_id: token.athlete?.id ?? null,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    return urlError("guardado", err);
  }

  return NextResponse.redirect(new URL(`/strava-conectar/${deportistaId}?ok=1`, request.url));
}
