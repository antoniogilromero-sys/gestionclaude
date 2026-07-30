import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
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
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={perfil.nombre} rol={perfil.rol} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        <EquipoList perfiles={perfiles ?? []} />
      </main>
    </div>
  );
}
