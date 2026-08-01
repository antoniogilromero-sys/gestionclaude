import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { toISODateLocal, parseLocalDate } from "@/lib/date";
import { PagosView } from "./PagosView";

function primerDiaMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function ultimoDiaMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
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
  if (!perfil || perfil.rol !== "director") redirect("/");

  const params = await searchParams;
  const mesDate = params.mes ? primerDiaMes(parseLocalDate(params.mes)) : primerDiaMes(new Date());
  const mes = toISODateLocal(mesDate);
  const mesFin = toISODateLocal(ultimoDiaMes(mesDate));

  const anteriorDate = new Date(mesDate.getFullYear(), mesDate.getMonth() - 1, 1);
  const siguienteDate = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 1);

  const [
    { data: grupos },
    { data: entrenadores },
    { data: tarifas },
    { data: asignaciones },
    { data: pagosExtra, error: pagosError },
  ] = await Promise.all([
    supabase
      .from("grupos")
      .select("id, nombre, disciplina, dias, hora_inicio, hora_fin")
      .eq("activo", true)
      .order("id"),
    supabase
      .from("perfiles")
      .select("id, nombre, rol")
      .in("rol", ["director", "entrenador"])
      .eq("activo", true)
      .order("nombre"),
    supabase.from("tarifas_entrenador").select("entrenador_id, disciplina, euros_hora"),
    supabase
      .from("asignaciones")
      .select("semana, grupo_id, entrenador_id")
      .gte("semana", mes)
      .lte("semana", mesFin)
      .order("semana"),
    supabase
      .from("pagos_extra")
      .select("id, entrenador_id, concepto, importe")
      .eq("mes", mes)
      .order("creado_en"),
  ]);

  const semanas = [...new Set((asignaciones ?? []).map((a) => a.semana))].sort();
  const asignacionesPorSemana = semanas.map((semana) => ({
    semana,
    asignaciones: (asignaciones ?? []).filter((a) => a.semana === semana),
  }));

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      {pagosError ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar los pagos
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de pagos_extra en Supabase.
            Detalle técnico: {pagosError.message}
          </p>
        </div>
      ) : (
        <PagosView
          mes={mes}
          mesAnterior={toISODateLocal(anteriorDate)}
          mesSiguiente={toISODateLocal(siguienteDate)}
          grupos={grupos ?? []}
          entrenadores={entrenadores ?? []}
          tarifas={tarifas ?? []}
          asignacionesPorSemana={asignacionesPorSemana}
          pagosExtra={pagosExtra ?? []}
        />
      )}
    </AppShell>
  );
}
