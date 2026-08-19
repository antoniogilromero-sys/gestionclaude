import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

function fmtMMSS(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtFecha(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type Marca = {
  deportista_id: number;
  prueba: string;
  tiempo_s: number;
  fecha: string;
  deportistas: { nombre: string } | { nombre: string }[] | null;
};

type Carrera = {
  id: number;
  deportista_id: number | null;
  equipo: string | null;
  carrera: string;
  carrera_s: number | null;
  t1_s: number | null;
  bici_s: number | null;
  t2_s: number | null;
  correr_s: number | null;
  total_s: number;
  fecha: string;
  deportistas: { nombre: string } | { nombre: string }[] | null;
};

function nombreDe(rel: { nombre: string } | { nombre: string }[] | null) {
  return Array.isArray(rel) ? (rel[0]?.nombre ?? "?") : (rel?.nombre ?? "?");
}

export default async function LigaTalentosPage() {
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

  const [{ data: marcas, error: errorMarcas }, { data: carreras, error: errorCarreras }] = await Promise.all([
    supabase
      .from("liga_talentos_marcas")
      .select("deportista_id, prueba, tiempo_s, fecha, deportistas(nombre)")
      .order("fecha", { ascending: false }),
    supabase
      .from("liga_talentos_carreras")
      .select(
        "id, deportista_id, equipo, carrera, carrera_s, t1_s, bici_s, t2_s, correr_s, total_s, fecha, deportistas(nombre)",
      )
      .order("carrera")
      .order("total_s", { ascending: true }),
  ]);

  if (errorMarcas || errorCarreras) {
    return (
      <AppShell nombre={perfil.nombre} rol={perfil.rol}>
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">No se ha podido cargar</b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de liga_talentos en Supabase. Detalle técnico:{" "}
            {errorMarcas?.message ?? errorCarreras?.message}
          </p>
        </div>
      </AppShell>
    );
  }

  // Tabla tipo "Toma de tiempos": filas = deportistas, columnas = cada
  // prueba distinta que haya, igual que el Excel de origen.
  const pruebas = [...new Set((marcas ?? []).map((m) => m.prueba))];
  const deportistasEnMarcas = new Map<number, string>();
  for (const m of marcas ?? []) deportistasEnMarcas.set(m.deportista_id, nombreDe(m.deportistas));
  const filasMarcas = [...deportistasEnMarcas.entries()]
    .map(([id, nombre]) => ({
      id,
      nombre,
      porPrueba: Object.fromEntries(
        pruebas.map((p) => [
          p,
          (marcas ?? []).find((m) => m.deportista_id === id && m.prueba === p) ?? null,
        ]),
      ),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const mejorPorPrueba = new Map<string, number>();
  for (const p of pruebas) {
    const valores = (marcas ?? []).filter((m) => m.prueba === p).map((m) => m.tiempo_s);
    if (valores.length > 0) mejorPorPrueba.set(p, Math.min(...valores));
  }

  const carrerasPorNombre = new Map<string, Carrera[]>();
  for (const c of (carreras ?? []) as Carrera[]) {
    const arr = carrerasPorNombre.get(c.carrera) ?? [];
    arr.push(c);
    carrerasPorNombre.set(c.carrera, arr);
  }

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-1">
        Liga de Talentos
      </h2>
      <p className="text-xs text-mute mb-4">Visible solo para ti.</p>

      <h3 className="font-display text-[13px] tracking-[.1em] uppercase text-signal mb-2.5">
        Toma de tiempos
      </h3>
      {filasMarcas.length === 0 ? (
        <p className="text-mute text-sm mb-6">Todavía no hay ninguna marca cargada.</p>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="border-collapse text-[13px] w-full">
            <thead>
              <tr>
                <th className="text-left font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2 sticky left-0 bg-deep">
                  Deportista
                </th>
                {pruebas.map((p) => (
                  <th
                    key={p}
                    className="text-right font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2 whitespace-nowrap"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasMarcas.map((f) => (
                <tr key={f.id}>
                  <td className="py-2 px-2 border-b border-edge/50 sticky left-0 bg-deep font-medium whitespace-nowrap">
                    {f.nombre}
                  </td>
                  {pruebas.map((p) => {
                    const m = f.porPrueba[p] as Marca | null;
                    const esMejor = m && mejorPorPrueba.get(p) === m.tiempo_s;
                    return (
                      <td
                        key={p}
                        className={`text-right py-2 px-2 border-b border-edge/50 tabular-nums whitespace-nowrap ${
                          esMejor ? "text-ok font-semibold" : ""
                        }`}
                      >
                        {m ? fmtMMSS(m.tiempo_s) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {[...carrerasPorNombre.entries()].map(([nombreCarrera, filas]) => (
        <div key={nombreCarrera} className="mb-6">
          <h3 className="font-display text-[13px] tracking-[.1em] uppercase text-signal mb-2.5">
            {nombreCarrera}
          </h3>
          <div className="overflow-x-auto">
            <table className="border-collapse text-[13px] w-full">
              <thead>
                <tr>
                  <th className="text-left font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2">
                    Nombre
                  </th>
                  <th className="text-right font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2">
                    Carrera
                  </th>
                  <th className="text-right font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2">
                    T1
                  </th>
                  <th className="text-right font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2">
                    Bici
                  </th>
                  <th className="text-right font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2">
                    T2
                  </th>
                  <th className="text-right font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2">
                    Correr
                  </th>
                  <th className="text-right font-display text-xs tracking-[.08em] uppercase text-mute border-b border-edge py-[7px] px-2">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((c, i) => (
                  <tr key={c.id}>
                    <td className="py-2 px-2 border-b border-edge/50 font-medium whitespace-nowrap">
                      {i === 0 && "🥇 "}
                      {i === 1 && "🥈 "}
                      {i === 2 && "🥉 "}
                      {c.equipo ?? nombreDe(c.deportistas)}
                    </td>
                    <td className="text-right py-2 px-2 border-b border-edge/50 tabular-nums">
                      {c.carrera_s != null ? fmtMMSS(c.carrera_s) : "—"}
                    </td>
                    <td className="text-right py-2 px-2 border-b border-edge/50 tabular-nums">
                      {c.t1_s != null ? fmtMMSS(c.t1_s) : "—"}
                    </td>
                    <td className="text-right py-2 px-2 border-b border-edge/50 tabular-nums">
                      {c.bici_s != null ? fmtMMSS(c.bici_s) : "—"}
                    </td>
                    <td className="text-right py-2 px-2 border-b border-edge/50 tabular-nums">
                      {c.t2_s != null ? fmtMMSS(c.t2_s) : "—"}
                    </td>
                    <td className="text-right py-2 px-2 border-b border-edge/50 tabular-nums">
                      {c.correr_s != null ? fmtMMSS(c.correr_s) : "—"}
                    </td>
                    <td className="text-right py-2 px-2 border-b border-edge/50 tabular-nums font-semibold">
                      {fmtMMSS(c.total_s)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span className="text-xs text-mute block mt-1.5">{fmtFecha(filas[0]?.fecha ?? "")}</span>
        </div>
      ))}

      {carrerasPorNombre.size === 0 && (
        <p className="text-mute text-sm">Todavía no hay ninguna carrera cargada.</p>
      )}
    </AppShell>
  );
}
