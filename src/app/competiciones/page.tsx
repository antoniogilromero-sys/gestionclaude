import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { Competiciones } from "./Competiciones";

export default async function CompeticionesPage() {
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

  const [{ data: deportistas }, { data: competiciones, error: eCompeticiones }] = await Promise.all([
    supabase
      .from("deportistas")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("competiciones")
      .select("id, deportista_id, anio, nombre_carrera, fecha, disciplina, tiempo, clasificacion, deportistas(nombre)")
      .order("anio", { ascending: false })
      .order("fecha", { ascending: false }),
  ]);

  const competicionesLimpias = (competiciones ?? []).map((c) => {
    const d = c.deportistas as unknown as { nombre: string } | { nombre: string }[] | null;
    const deportistaNombre = Array.isArray(d) ? (d[0]?.nombre ?? "?") : (d?.nombre ?? "?");
    return {
      id: c.id as number,
      deportista_id: c.deportista_id as number,
      anio: c.anio as number,
      nombre_carrera: c.nombre_carrera as string,
      fecha: c.fecha as string | null,
      disciplina: c.disciplina as string,
      tiempo: c.tiempo as string | null,
      clasificacion: c.clasificacion as string | null,
      deportistaNombre,
    };
  });

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Competiciones
      </h2>
      {eCompeticiones ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el listado
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de competiciones en Supabase.
            Detalle técnico: {eCompeticiones.message}
          </p>
        </div>
      ) : (
        <Competiciones
          deportistas={deportistas ?? []}
          competiciones={competicionesLimpias}
          soloLectura={perfil.rol !== "director"}
        />
      )}
    </AppShell>
  );
}
