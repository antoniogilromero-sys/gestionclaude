import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { RutasClient } from "./RutasClient";

export default async function RutasPage() {
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

  const { data: rutas, error } = await supabase
    .from("rutas_strava")
    .select("id, tipo, nombre, distancia_km, desnivel_m, fecha, deportistas(nombre)")
    .order("fecha", { ascending: false })
    .limit(300);

  const rutasLimpias = (rutas ?? []).map((r) => {
    const dep = r.deportistas as unknown as { nombre: string } | { nombre: string }[] | null;
    const deportistaNombre = Array.isArray(dep) ? (dep[0]?.nombre ?? "?") : (dep?.nombre ?? "?");
    return {
      id: r.id as number,
      tipo: r.tipo as "carretera" | "montana",
      nombre: r.nombre as string,
      distanciaKm: r.distancia_km as number | null,
      desnivelM: r.desnivel_m as number | null,
      fecha: r.fecha as string,
      deportista: deportistaNombre,
    };
  });

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar la biblioteca de rutas
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de rutas en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      ) : (
        <RutasClient rutas={rutasLimpias} esDirector={perfil.rol === "director"} />
      )}
    </AppShell>
  );
}
