import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { toISODateLocal, parseLocalDate, lunesDe } from "@/lib/date";
import { RepartoGrid } from "./RepartoGrid";

export default async function RepartoPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
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

  const params = await searchParams;
  const base = params.semana ? parseLocalDate(params.semana) : new Date();
  const semanaDate = lunesDe(base);
  const semana = toISODateLocal(semanaDate);

  const anteriorDate = new Date(semanaDate);
  anteriorDate.setDate(semanaDate.getDate() - 7);
  const siguienteDate = new Date(semanaDate);
  siguienteDate.setDate(semanaDate.getDate() + 7);

  const [{ data: grupos }, { data: entrenadores }, { data: asignaciones }] =
    await Promise.all([
      supabase
        .from("grupos")
        .select("id, nombre, dias, hora_inicio, hora_fin")
        .eq("activo", true)
        .order("id"),
      supabase
        .from("perfiles")
        .select("id, nombre")
        .eq("rol", "entrenador")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("asignaciones")
        .select("grupo_id, entrenador_id")
        .eq("semana", semana),
    ]);

  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={perfil.nombre} rol={perfil.rol} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        <RepartoGrid
          semana={semana}
          semanaAnterior={toISODateLocal(anteriorDate)}
          semanaSiguiente={toISODateLocal(siguienteDate)}
          grupos={grupos ?? []}
          entrenadores={entrenadores ?? []}
          asignacionesIniciales={asignaciones ?? []}
        />
      </main>
    </div>
  );
}
