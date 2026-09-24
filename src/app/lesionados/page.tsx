import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { LesionadosClient } from "./LesionadosClient";

export default async function LesionadosPage() {
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

  const esDirector = perfil.rol === "director";

  const [{ data: lesiones, error }, { data: seguimientos }, { data: documentos }, { data: deportistas }] =
    await Promise.all([
      supabase
        .from("lesiones")
        .select("id, deportista_id, fecha_lesion, zona, descripcion, estado, fecha_recuperacion, deportistas(nombre)")
        .order("fecha_lesion", { ascending: false }),
      supabase
        .from("lesion_seguimiento")
        .select("id, lesion_id, fecha, nota, creado_en")
        .order("fecha", { ascending: false }),
      supabase
        .from("lesion_documentos")
        .select("id, lesion_id, nombre, storage_path, creado_en")
        .order("creado_en", { ascending: false }),
      esDirector
        ? supabase.from("deportistas").select("id, nombre").eq("activo", true).order("nombre")
        : Promise.resolve({ data: [] as { id: number; nombre: string }[] }),
    ]);

  const lesionesLimpias = (lesiones ?? []).map((l) => {
    const d = l.deportistas as unknown as { nombre: string } | { nombre: string }[] | null;
    const deportistaNombre = Array.isArray(d) ? (d[0]?.nombre ?? "?") : (d?.nombre ?? "?");
    return {
      id: l.id as number,
      deportistaNombre,
      fechaLesion: l.fecha_lesion as string,
      zona: l.zona as string | null,
      descripcion: l.descripcion as string,
      estado: l.estado as "activa" | "recuperado",
      fechaRecuperacion: l.fecha_recuperacion as string | null,
      seguimiento: (seguimientos ?? [])
        .filter((s) => s.lesion_id === l.id)
        .map((s) => ({ id: s.id as number, fecha: s.fecha as string, nota: s.nota as string })),
      documentos: (documentos ?? [])
        .filter((d) => d.lesion_id === l.id)
        .map((d) => ({
          id: d.id as number,
          nombre: d.nombre as string,
          storagePath: d.storage_path as string,
          creadoEn: d.creado_en as string,
        })),
    };
  });

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el listado
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de lesiones en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      ) : (
        <LesionadosClient
          lesiones={lesionesLimpias}
          deportistas={deportistas ?? []}
          esDirector={esDirector}
        />
      )}
    </AppShell>
  );
}
