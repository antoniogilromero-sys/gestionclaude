import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { NuevaJornadaForm } from "../NuevaJornadaForm";

export default async function NuevaJornadaPage() {
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

  // El director también puede dar una jornada él mismo, así que entran
  // los dos roles activos (mismo criterio que en /reparto).
  const { data: entrenadores } = await supabase
    .from("perfiles")
    .select("id, nombre")
    .in("rol", ["director", "entrenador"])
    .eq("activo", true)
    .order("nombre");

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <NuevaJornadaForm entrenadores={entrenadores ?? []} />
    </AppShell>
  );
}
