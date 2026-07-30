import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
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
      .select("id, nombre, ref, categoria, grupo_id")
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
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={perfil.nombre} rol={perfil.rol} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        <AnalisisClient
          deportistas={deportistas ?? []}
          tiposTest={tiposTest ?? []}
          grupos={grupos ?? []}
        />
      </main>
    </div>
  );
}
