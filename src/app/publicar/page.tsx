import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PublicarForm } from "./PublicarForm";

export default async function PublicarPage() {
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

  const { data: grupos } = await supabase
    .from("grupos")
    .select("id, nombre")
    .eq("activo", true)
    .order("id");

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <PublicarForm grupos={grupos ?? []} />
    </AppShell>
  );
}
