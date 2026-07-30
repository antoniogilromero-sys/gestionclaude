import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { EquipoList } from "./EquipoList";

export default async function EquipoPage() {
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

  const { data: perfiles } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol, activo")
    .neq("rol", "director")
    .order("nombre");

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <EquipoList perfiles={perfiles ?? []} />
    </AppShell>
  );
}
