import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { HorariosList } from "./HorariosList";

export default async function HorariosPage() {
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

  const { data: horarios, error } = await supabase
    .from("horarios_entrenamiento")
    .select("id, categoria, dia, disciplina, hora_inicio, hora_fin, lugar, notas")
    .order("hora_inicio");

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Horarios de entrenamientos
        </h2>
        <Link
          href="/horarios/nuevo"
          className="font-display text-xs tracking-[.08em] uppercase text-signal"
        >
          + Nuevo
        </Link>
      </div>

      {error && (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5 mb-4">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el horario
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de horarios_entrenamiento en
            Supabase. Detalle técnico: {error.message}
          </p>
        </div>
      )}

      {!error && <HorariosList horarios={horarios ?? []} />}
    </AppShell>
  );
}
