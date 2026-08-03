import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { InscripcionesList } from "./InscripcionesList";

export default async function InscripcionesPage() {
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

  const [{ data: inscripciones, error }, { data: deportistas }] = await Promise.all([
    supabase
      .from("inscripciones")
      .select(
        "id, email, nombre_completo, dni, fecha_nacimiento, domicilio, talla_camiseta, dias_piscina, proteccion_datos, derechos_imagen, telefono, deportista_id, creado_en",
      )
      .order("creado_en", { ascending: false }),
    supabase.from("deportistas").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
        Inscripciones
      </h2>
      <p className="text-xs text-mute leading-relaxed mb-4">
        Datos personales del formulario de alta de socios. Solo tú puedes verlos.
      </p>

      {error && (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5 mb-4">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el listado
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de inscripciones en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      )}

      {!error && (
        <InscripcionesList
          inscripciones={inscripciones ?? []}
          deportistas={deportistas ?? []}
        />
      )}
    </AppShell>
  );
}
