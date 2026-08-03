import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { NuevoHorarioForm } from "../NuevoHorarioForm";

export default async function NuevoHorarioPage() {
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

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <NuevoHorarioForm />
    </AppShell>
  );
}
