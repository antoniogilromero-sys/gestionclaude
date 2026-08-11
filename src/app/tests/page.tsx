import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { toISODateLocal, lunesDe } from "@/lib/date";
import { TestsClient } from "./TestsClient";

export default async function TestsPage() {
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

  const semana = toISODateLocal(lunesDe(new Date()));

  const [{ data: tiposTest }, { data: deportistas }, { data: misAsignaciones }, { data: grupos }, { data: depGrupos }] =
    await Promise.all([
      supabase
        .from("tipos_test")
        .select("id, nombre, disciplina, distancia_m, metrica, mejor_es")
        .order("disciplina")
        .order("id"),
      supabase
        .from("deportistas")
        .select("id, ref, nombre, categoria")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("asignaciones")
        .select("grupo_id")
        .eq("entrenador_id", user.id)
        .eq("semana", semana),
      supabase.from("grupos").select("id, nombre"),
      supabase.from("deportista_grupo").select("deportista_id, grupo_id"),
    ]);

  const misGrupoIds = [...new Set((misAsignaciones ?? []).map((a) => a.grupo_id))];

  const nombrePorGrupoId = new Map((grupos ?? []).map((g) => [g.id, g.nombre]));
  const gruposPorDeportista = new Map<number, number[]>();
  (depGrupos ?? []).forEach((dg) => {
    const arr = gruposPorDeportista.get(dg.deportista_id) ?? [];
    arr.push(dg.grupo_id);
    gruposPorDeportista.set(dg.deportista_id, arr);
  });

  const deportistasLimpios = (deportistas ?? []).map((d) => {
    const grupoIds = gruposPorDeportista.get(d.id) ?? [];
    const grupoNombre =
      grupoIds.map((id) => nombrePorGrupoId.get(id)).filter(Boolean).join(" · ") || null;
    return {
      id: d.id as number,
      ref: d.ref as string | null,
      nombre: d.nombre as string,
      categoria: d.categoria as string | null,
      grupoIds,
      grupoNombre,
    };
  });

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <TestsClient
        userId={user.id}
        tiposTest={tiposTest ?? []}
        deportistas={deportistasLimpios}
        misGrupoIds={misGrupoIds}
        grupos={grupos ?? []}
      />
    </AppShell>
  );
}
