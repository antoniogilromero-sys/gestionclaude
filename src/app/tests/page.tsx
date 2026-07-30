import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
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

  const [{ data: tiposTest }, { data: deportistas }, { data: misAsignaciones }, { data: grupos }] =
    await Promise.all([
      supabase
        .from("tipos_test")
        .select("id, nombre, disciplina, distancia_m, metrica, mejor_es")
        .order("disciplina")
        .order("id"),
      supabase
        .from("deportistas")
        .select("id, ref, nombre, categoria, grupo_id, grupos(nombre)")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("asignaciones")
        .select("grupo_id")
        .eq("entrenador_id", user.id)
        .eq("semana", semana),
      supabase.from("grupos").select("id, nombre"),
    ]);

  const misGrupoIds = [...new Set((misAsignaciones ?? []).map((a) => a.grupo_id))];

  const deportistasLimpios = (deportistas ?? []).map((d) => {
    const g = d.grupos as unknown as { nombre: string } | { nombre: string }[] | null;
    const grupoNombre = Array.isArray(g) ? (g[0]?.nombre ?? null) : (g?.nombre ?? null);
    return {
      id: d.id as number,
      ref: d.ref as string | null,
      nombre: d.nombre as string,
      categoria: d.categoria as string | null,
      grupo_id: d.grupo_id as number | null,
      grupoNombre,
    };
  });

  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={perfil.nombre} rol={perfil.rol} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        <TestsClient
          userId={user.id}
          tiposTest={tiposTest ?? []}
          deportistas={deportistasLimpios}
          misGrupoIds={misGrupoIds}
          grupos={grupos ?? []}
        />
      </main>
    </div>
  );
}
