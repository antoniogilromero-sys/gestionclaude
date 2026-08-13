import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PrevisionGrid } from "./PrevisionGrid";

export default async function PrevisionEntrenadoresPage() {
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

  const { data: filas, error } = await supabase
    .from("prevision_entrenadores")
    .select("id, dia, hora_inicio, hora_fin, entrenador, grupo, disciplina, orden")
    .order("hora_inicio")
    .order("orden");

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Previsión de entrenadores
        </h2>
        <Link
          href="/prevision-entrenadores/nuevo"
          className="font-display text-xs tracking-[.08em] uppercase text-signal"
        >
          + Nuevo
        </Link>
      </div>
      <p className="text-xs text-mute leading-relaxed mb-4">
        Tu plantilla orientativa de quién suele cubrir cada franja. Es solo
        para ti — el reparto real de cada semana (lo que ven los
        entrenadores) se sigue ajustando en Reparto.
      </p>

      {error && (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5 mb-4">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar la previsión
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de prevision_entrenadores
            en Supabase. Detalle técnico: {error.message}
          </p>
        </div>
      )}

      {!error && <PrevisionGrid filas={filas ?? []} />}
    </AppShell>
  );
}
