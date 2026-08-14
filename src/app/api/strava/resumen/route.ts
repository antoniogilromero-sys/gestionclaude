import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obtenerResumenStrava } from "@/lib/strava";

// Lo llama FichaIndividual (en /analisis) para pintar el resumen de
// Strava de un deportista. Comprueba la sesión aquí también, no solo en
// la página: es una ruta de API y podría llamarse directamente.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, activo")
    .eq("id", user.id)
    .single();
  if (!perfil || !perfil.activo || (perfil.rol !== "director" && perfil.rol !== "entrenador")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const deportistaId = Number(request.nextUrl.searchParams.get("deportistaId"));
  if (!deportistaId) {
    return NextResponse.json({ error: "Falta deportistaId" }, { status: 400 });
  }

  try {
    const resumen = await obtenerResumenStrava(deportistaId);
    return NextResponse.json(resumen);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al consultar Strava" },
      { status: 500 },
    );
  }
}
