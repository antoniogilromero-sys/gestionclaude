import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { RankingsClient } from "./RankingsClient";

export default async function RankingsPage() {
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

  const anioActual = new Date().getFullYear();

  const [{ data: tiposTest }, { data: marcas, error: eMarcas }] = await Promise.all([
    supabase
      .from("tipos_test")
      .select("id, nombre, disciplina, metrica, mejor_es")
      .order("disciplina")
      .order("id"),
    supabase.rpc("mejores_marcas", { p_anio: anioActual }),
  ]);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <RankingsClient
        tiposTest={tiposTest ?? []}
        marcasIniciales={marcas ?? []}
        anioInicial={anioActual}
        error={eMarcas?.message ?? null}
      />
    </AppShell>
  );
}
