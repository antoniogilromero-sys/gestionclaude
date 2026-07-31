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

  const { data: perfiles, error } = await supabase
    .from("perfiles")
    .select("id, nombre, email, telefono, rol, activo")
    .neq("rol", "director")
    .order("nombre");

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el equipo
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte alguna migración por ejecutar en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      ) : (
        <EquipoList perfiles={perfiles ?? []} />
      )}
    </AppShell>
  );
}
