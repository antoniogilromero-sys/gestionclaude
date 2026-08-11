import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { DeportistasList } from "./DeportistasList";

export default async function DeportistasPage() {
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

  const [{ data: deportistas }, { data: grupos }, { data: depGrupos }] = await Promise.all([
    supabase
      .from("deportistas")
      .select("id, ref, nombre, categoria, activo")
      .order("nombre"),
    supabase.from("grupos").select("id, nombre").eq("activo", true).order("id"),
    supabase.from("deportista_grupo").select("deportista_id, grupo_id"),
  ]);

  const gruposPorDeportista = new Map<number, number[]>();
  (depGrupos ?? []).forEach((dg) => {
    const arr = gruposPorDeportista.get(dg.deportista_id) ?? [];
    arr.push(dg.grupo_id);
    gruposPorDeportista.set(dg.deportista_id, arr);
  });

  const deportistasConGrupos = (deportistas ?? []).map((d) => ({
    ...d,
    grupoIds: gruposPorDeportista.get(d.id) ?? [],
  }));

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <DeportistasList deportistas={deportistasConGrupos} grupos={grupos ?? []} />
    </AppShell>
  );
}
