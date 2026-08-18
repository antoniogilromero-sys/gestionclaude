import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { obtenerResumenStrava } from "@/lib/strava";
import { EntrenamientoDiarioClient } from "./EntrenamientoDiarioClient";

export default async function EntrenamientoDiarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre, rol")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.rol === "pendiente") redirect("/");

  const [{ data: conexiones }, { data: rpes }] = await Promise.all([
    supabase.from("strava_conexiones").select("deportista_id, deportistas(nombre)"),
    supabase.from("strava_rpe").select("strava_actividad_id, rpe, notas"),
  ]);

  const rpeMap = new Map((rpes ?? []).map((r) => [r.strava_actividad_id, { rpe: r.rpe, notas: r.notas }]));

  const haceUnaSemana = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const resumenes = await Promise.all(
    (conexiones ?? []).map(async (c) => {
      const resumen = await obtenerResumenStrava(c.deportista_id);
      const nombreRel = c.deportistas as unknown as { nombre: string } | { nombre: string }[] | null;
      const nombre = Array.isArray(nombreRel) ? (nombreRel[0]?.nombre ?? "?") : (nombreRel?.nombre ?? "?");
      const actividades = resumen.actividades
        .filter((a) => new Date(a.fecha).getTime() >= haceUnaSemana)
        .map((a) => ({ ...a, rpeGuardado: rpeMap.get(a.id) ?? null }));
      return { deportistaId: c.deportista_id, nombre, actividades };
    }),
  );

  const conActividad = resumenes
    .filter((r) => r.actividades.length > 0)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Entrenamiento diario
      </h2>
      <p className="text-xs text-mute mb-3.5">
        Últimos 7 días de quienes tienen Strava conectado. Apunta aquí la percepción del esfuerzo
        (RPE) de cada sesión.
      </p>
      {conActividad.length === 0 ? (
        <p className="text-mute text-sm text-center py-9">
          Nadie con Strava conectado tiene actividad en los últimos 7 días.
        </p>
      ) : (
        <EntrenamientoDiarioClient deportistas={conActividad} />
      )}
    </AppShell>
  );
}
