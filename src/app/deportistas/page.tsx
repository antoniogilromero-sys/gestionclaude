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

  const [{ data: deportistas }, { data: grupos }] = await Promise.all([
    supabase
      .from("deportistas")
      .select("id, ref, nombre, categoria, grupo_id, activo")
      .order("nombre"),
    supabase.from("grupos").select("id, nombre").eq("activo", true).order("id"),
  ]);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <DeportistasList deportistas={deportistas ?? []} grupos={grupos ?? []} />
    </AppShell>
  );
}
