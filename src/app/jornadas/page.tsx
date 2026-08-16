import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { JornadasList } from "./JornadasList";
import { CuadranteAnio } from "./CuadranteAnio";
import { DocumentosJornada } from "./DocumentosJornada";

export default async function JornadasPage() {
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

  const [{ data: jornadas, error }, { data: documentos }] = await Promise.all([
    supabase
      .from("jornadas_colegios")
      .select(
        "id, anio, colegio, fecha_horario, disciplina, contacto, jornada_entrenador(perfiles(nombre))",
      )
      .order("anio", { ascending: false })
      .order("id", { ascending: false }),
    supabase
      .from("jornadas_documentos")
      .select("id, nombre, storage_path, creado_en")
      .order("creado_en", { ascending: false }),
  ]);

  const jornadasLimpias = (jornadas ?? []).map((j) => {
    const relacion = j.jornada_entrenador as unknown as
      | { perfiles: { nombre: string } | null }[]
      | null;
    const entrenadores = (relacion ?? [])
      .map((r) => r.perfiles?.nombre)
      .filter((n): n is string => Boolean(n));
    return {
      id: j.id as number,
      anio: j.anio as number,
      colegio: j.colegio as string,
      fechaHorario: j.fecha_horario as string,
      disciplina: j.disciplina as string,
      contacto: j.contacto as string | null,
      entrenadores,
    };
  });

  const anioActual = new Date().getFullYear();
  const jornadasAnioActual = jornadasLimpias.filter((j) => j.anio === anioActual);
  const jornadasOtrosAnios = jornadasLimpias.filter((j) => j.anio !== anioActual);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Jornadas en colegios
        </h2>
        <Link
          href="/jornadas/nueva"
          className="font-display text-xs tracking-[.08em] uppercase text-signal"
        >
          + Nueva
        </Link>
      </div>

      {error && (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5 mb-4">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el listado
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de jornadas en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      )}

      {!error && (
        <>
          <DocumentosJornada documentos={documentos ?? []} />

          <CuadranteAnio anio={anioActual} jornadas={jornadasAnioActual} />

          {jornadasOtrosAnios.length > 0 && (
            <>
              <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mt-5 mb-2.5">
                Años anteriores
              </h2>
              <JornadasList jornadas={jornadasOtrosAnios} />
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
