import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { toISODateLocal, parseLocalDate, lunesDe } from "@/lib/date";
import { RepartoGrid } from "./RepartoGrid";

function primerDiaMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function ultimoDiaMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export default async function RepartoPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
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
  const esDirector = perfil.rol === "director";

  const params = await searchParams;
  const base = params.semana ? parseLocalDate(params.semana) : new Date();
  const semanaDate = lunesDe(base);

  // Ventana del entrenador: solo ve hasta la semana que "se abre" el
  // sábado anterior, es decir 2 días antes de su lunes. El director no
  // tiene límite. (Ej.: la semana del lunes 14 se abre el sábado 12.)
  const hoy = new Date();
  const maxLunesEntrenador = lunesDe(
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 2),
  );
  if (!esDirector && semanaDate.getTime() > maxLunesEntrenador.getTime()) {
    redirect(`/reparto?semana=${toISODateLocal(maxLunesEntrenador)}`);
  }

  const semana = toISODateLocal(semanaDate);

  const anteriorDate = new Date(semanaDate);
  anteriorDate.setDate(semanaDate.getDate() - 7);
  const siguienteDate = new Date(semanaDate);
  siguienteDate.setDate(semanaDate.getDate() + 7);
  const puedeAvanzar =
    esDirector || siguienteDate.getTime() <= maxLunesEntrenador.getTime();

  // El coste semanal (sueldos) es un dato solo para el director — a un
  // entrenador no le hace falta ver lo que cobra el resto del equipo, así
  // que ni se pide si no es director.
  const [{ data: grupos }, { data: entrenadores }, { data: asignaciones }] = await Promise.all([
    supabase
      .from("grupos")
      .select("id, nombre, disciplina, dias, hora_inicio, hora_fin, orden")
      .eq("activo", true)
      .order("orden")
      .order("id"),
    // Via función (security definer): `perfiles` solo la lee entera el
    // director, y aquí hace falta que el entrenador también vea el nombre
    // del resto del equipo para saber quién va a cada grupo.
    supabase.rpc("entrenadores_visibles"),
    supabase
      .from("asignaciones")
      .select("grupo_id, entrenador_id")
      .eq("semana", semana),
  ]);

  let tarifas: { entrenador_id: string; disciplina: string; euros_hora: number }[] = [];
  let asignacionesPorSemanaMes: { semana: string; asignaciones: { grupo_id: number; entrenador_id: string }[] }[] = [];
  if (esDirector) {
    const { data } = await supabase
      .from("tarifas_entrenador")
      .select("entrenador_id, disciplina, euros_hora");
    tarifas = data ?? [];

    // Coste acumulado del mes en el que cae la semana que se está
    // viendo — mismo criterio de mes natural que /pagos, para poder
    // enseñar el corte total justo debajo del coste semanal.
    const mesInicio = toISODateLocal(primerDiaMes(semanaDate));
    const mesFin = toISODateLocal(ultimoDiaMes(semanaDate));
    const { data: asignacionesMes } = await supabase
      .from("asignaciones")
      .select("semana, grupo_id, entrenador_id")
      .gte("semana", mesInicio)
      .lte("semana", mesFin)
      .order("semana");

    const semanasMes = [...new Set((asignacionesMes ?? []).map((a) => a.semana))].sort();
    asignacionesPorSemanaMes = semanasMes.map((s) => ({
      semana: s,
      asignaciones: (asignacionesMes ?? []).filter((a) => a.semana === s),
    }));
  }

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <RepartoGrid
        esDirector={esDirector}
        semana={semana}
        semanaAnterior={toISODateLocal(anteriorDate)}
        semanaSiguiente={toISODateLocal(siguienteDate)}
        puedeAvanzar={puedeAvanzar}
        grupos={grupos ?? []}
        entrenadores={entrenadores ?? []}
        asignacionesIniciales={asignaciones ?? []}
        tarifas={tarifas}
        asignacionesPorSemanaMes={asignacionesPorSemanaMes}
      />
    </AppShell>
  );
}
