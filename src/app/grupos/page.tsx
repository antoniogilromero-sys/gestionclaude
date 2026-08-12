import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { GruposClient } from "./GruposClient";

export default async function GruposPage() {
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

  const [{ data: grupos }, { data: deportistas }, { data: depGrupos }] = await Promise.all([
    supabase.from("grupos").select("id, nombre").eq("activo", true).order("id"),
    supabase
      .from("deportistas")
      .select("id, nombre, categoria")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("deportista_grupo").select("deportista_id, grupo_id"),
  ]);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <GruposClient
        grupos={grupos ?? []}
        deportistas={deportistas ?? []}
        depGrupos={depGrupos ?? []}
      />
    </AppShell>
  );
}
