import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { CuotasList } from "./CuotasList";

export default async function CuotasPage() {
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

  const { data: cuotas, error } = await supabase
    .from("cuotas_stripe")
    .select("id, nombre_deportista, importe, estado, creado_en")
    .order("creado_en", { ascending: false });

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Cuotas por Stripe
      </h2>
      <p className="text-xs text-mute leading-relaxed mb-4">
        Quién paga la cuota mensual del club por Stripe. Enlace para las familias:{" "}
        <span className="text-chalk">triatlonalpedrete.vercel.app/cuota</span>
      </p>

      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el listado
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de cuotas en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      ) : (
        <CuotasList cuotas={cuotas ?? []} />
      )}
    </AppShell>
  );
}
