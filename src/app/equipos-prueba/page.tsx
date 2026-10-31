import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PruebasList } from "./PruebasList";

export default async function EquiposPruebaPage() {
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

  const { data: pruebas, error } = await supabase
    .from("pruebas_equipos")
    .select("id, nombre, fecha, lugar, prueba_equipo(id, prueba_equipo_miembro(id))")
    .order("fecha", { ascending: false, nullsFirst: true })
    .order("id", { ascending: false });

  type Fila = {
    id: number;
    nombre: string;
    fecha: string | null;
    lugar: string | null;
    prueba_equipo: { id: number; prueba_equipo_miembro: { id: number }[] }[];
  };
  const filas = ((pruebas ?? []) as unknown as Fila[]).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    fecha: p.fecha,
    lugar: p.lugar,
    equipos: p.prueba_equipo.length,
    nadadores: p.prueba_equipo.reduce((s, e) => s + e.prueba_equipo_miembro.length, 0),
  }));

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar docs/migracion_equipos_prueba.sql en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      ) : (
        <PruebasList pruebas={filas} />
      )}
    </AppShell>
  );
}
