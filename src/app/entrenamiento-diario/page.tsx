import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
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

  // Solo la lista de quién tiene Strava conectado — nada de Strava en sí.
  // Los entrenos de cada uno se piden en directo justo al pinchar en su
  // nombre (ver EntrenamientoDiarioClient), para que siempre sea lo más
  // reciente en ese momento, no lo que hubiera cuando se abrió la
  // página. Con muchos conectados, además, la página carga mucho más
  // rápido así que pidiendo Strava de todos de golpe.
  const [{ data: conexiones }, { data: rpes }] = await Promise.all([
    supabase.from("strava_conexiones").select("deportista_id, deportistas(nombre)"),
    supabase.from("strava_rpe").select("strava_actividad_id, rpe, notas"),
  ]);

  const rpeMap = new Map((rpes ?? []).map((r) => [r.strava_actividad_id, { rpe: r.rpe, notas: r.notas }]));

  const deportistas = (conexiones ?? [])
    .map((c) => {
      const nombreRel = c.deportistas as unknown as { nombre: string } | { nombre: string }[] | null;
      const nombre = Array.isArray(nombreRel) ? (nombreRel[0]?.nombre ?? "?") : (nombreRel?.nombre ?? "?");
      return { deportistaId: c.deportista_id, nombre };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Entrenamiento diario
      </h2>
      <p className="text-xs text-mute mb-3.5">
        Deportistas con Strava conectado. Pincha en uno para pedir en directo sus entrenos de los
        últimos 7 días y apuntar la percepción del esfuerzo (RPE) de cada sesión.
      </p>
      {deportistas.length === 0 ? (
        <p className="text-mute text-sm text-center py-9">
          Todavía nadie tiene Strava conectado.
        </p>
      ) : (
        <EntrenamientoDiarioClient
          deportistas={deportistas}
          rpes={Object.fromEntries(rpeMap)}
        />
      )}
    </AppShell>
  );
}
