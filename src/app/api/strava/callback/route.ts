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
    return NextResponse.redirect(new URL(`/strava-conectar/${deportistaId}?error=1`, request.url));
  }

  try {
    const token = await intercambiarCodigoPorToken(code);
    const supabase = createAdminClient();
    const { error } = await supabase.from("strava_conexiones").upsert({
      deportista_id: deportistaId,
      strava_atleta_id: token.athlete?.id ?? null,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at,
    });
    if (error) throw new Error(error.message);
  } catch {
    return NextResponse.redirect(new URL(`/strava-conectar/${deportistaId}?error=1`, request.url));
  }

  return NextResponse.redirect(new URL(`/strava-conectar/${deportistaId}?ok=1`, request.url));
}
