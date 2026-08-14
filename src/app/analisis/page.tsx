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

  const [{ data: deportistas }, { data: tiposTest }, { data: grupos }] = await Promise.all([
    supabase
      .from("deportistas")
      .select(
        "id, nombre, ref, categoria, fc_max_ref, fc_reposo, peso_ref, ftp_ciclismo_w, ftp_carrera_w, ritmo_umbral_s_km",
      )
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("tipos_test")
      .select("id, nombre, disciplina, metrica, mejor_es, distancia_m")
      .order("disciplina")
      .order("id"),
    supabase.from("grupos").select("id, nombre").order("id"),
  ]);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <AnalisisClient deportistas={deportistas ?? []} tiposTest={tiposTest ?? []} grupos={grupos ?? []} />
    </AppShell>
  );
}
