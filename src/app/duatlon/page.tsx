import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { DuatlonClient } from "./DuatlonClient";

const FECHA_PRUEBA = "2027-02-28";

export default async function DuatlonPage() {
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

  const { data: items, error } = await supabase
    .from("duatlon_items")
    .select("id, categoria, titulo, nota, enlace, archivo_ruta, archivo_nombre, es_tarea, hecho, creado_en")
    .order("creado_en", { ascending: false })
    .order("id", { ascending: false });

  // Enlaces temporales (1 hora) a los archivos privados.
  const rutas = (items ?? []).map((i) => i.archivo_ruta).filter((r): r is string => Boolean(r));
  const urlPorRuta = new Map<string, string>();
  if (rutas.length > 0) {
    const { data: firmadas } = await supabase.storage.from("duatlon").createSignedUrls(rutas, 3600);
    for (const f of firmadas ?? []) {
      if (f.path && f.signedUrl) urlPorRuta.set(f.path, f.signedUrl);
    }
  }

  // Días que faltan, contando desde hoy en Madrid.
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
  const dias = Math.round((Date.parse(FECHA_PRUEBA) - Date.parse(hoy)) / 86_400_000);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">No se ha podido cargar</b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar docs/migracion_duatlon_organizacion.sql en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      ) : (
        <DuatlonClient
          dias={dias}
          items={(items ?? []).map((i) => ({
            ...i,
            archivoUrl: i.archivo_ruta ? (urlPorRuta.get(i.archivo_ruta) ?? null) : null,
          }))}
        />
      )}
    </AppShell>
  );
}
