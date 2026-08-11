import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { AnalisisClient } from "./AnalisisClient";

export default async function AnalisisPage() {
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

  const [{ data: deportistas }, { data: tiposTest }, { data: grupos }, { data: competiciones, error: eCompeticiones }] =
    await Promise.all([
      supabase
        .from("deportistas")
        .select("id, nombre, ref, categoria")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("tipos_test")
        .select("id, nombre, disciplina, metrica, mejor_es, distancia_m")
        .order("disciplina")
        .order("id"),
      supabase.from("grupos").select("id, nombre").order("id"),
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
      <AnalisisClient
        deportistas={deportistas ?? []}
        tiposTest={tiposTest ?? []}
        grupos={grupos ?? []}
        competiciones={competicionesLimpias}
        competicionesError={eCompeticiones?.message ?? null}
      />
    </AppShell>
  );
}
