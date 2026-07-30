import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { fmtTiempo } from "@/lib/formato";

type Fila = {
  id: number;
  fecha: string;
  deportista: string;
  grupo_id: number | null;
  test: string;
  disciplina: string;
  metrica: string;
  tiempo_s: number | null;
  distancia_m: number | null;
  potencia_w: number | null;
  registrado_por: string | null;
};

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string; grupo?: string; desde?: string; hasta?: string }>;
}) {
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

  const params = await searchParams;

  const [{ data: tiposTest }, { data: grupos }, { data: perfiles }, { count: totalSesiones }] =
    await Promise.all([
      supabase.from("tipos_test").select("id, nombre").order("disciplina").order("id"),
      supabase.from("grupos").select("id, nombre").order("id"),
      supabase.from("perfiles").select("id, nombre"),
      supabase.from("sesiones").select("id", { count: "exact", head: true }),
    ]);

  const nombrePorId = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));

  let query = supabase
    .from("resultados_calc")
    .select(
      "id, fecha, deportista, grupo_id, test, disciplina, metrica, tiempo_s, distancia_m, potencia_w, registrado_por",
    )
    .order("fecha", { ascending: false })
    .limit(500);

  if (params.test) query = query.eq("tipo_test_id", Number(params.test));
  if (params.grupo) query = query.eq("grupo_id", Number(params.grupo));
  if (params.desde) query = query.gte("fecha", params.desde);
  if (params.hasta) query = query.lte("fecha", params.hasta);

  const { data: filas } = await query;
  const marcas = (filas ?? []) as Fila[];
  const deportistasDistintos = new Set(marcas.map((m) => m.deportista)).size;

  const qs = new URLSearchParams();
  if (params.test) qs.set("test", params.test);
  if (params.grupo) qs.set("grupo", params.grupo);
  if (params.desde) qs.set("desde", params.desde);
  if (params.hasta) qs.set("hasta", params.hasta);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
            <b className="font-display text-[26px] block leading-none">{marcas.length}</b>
            <span className="text-[11px] text-mute tracking-[.04em]">MARCAS</span>
          </div>
          <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
            <b className="font-display text-[26px] block leading-none">{deportistasDistintos}</b>
            <span className="text-[11px] text-mute tracking-[.04em]">DEPORTISTAS</span>
          </div>
          <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
            <b className="font-display text-[26px] block leading-none">{totalSesiones ?? 0}</b>
            <span className="text-[11px] text-mute tracking-[.04em]">SESIONES</span>
          </div>
        </div>

        <form className="grid grid-cols-2 gap-2.5 mb-2.5">
          <select
            name="test"
            defaultValue={params.test ?? ""}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
          >
            <option value="">Todas las pruebas</option>
            {(tiposTest ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          <select
            name="grupo"
            defaultValue={params.grupo ?? ""}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
          >
            <option value="">Todos los grupos</option>
            {(grupos ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="desde"
            defaultValue={params.desde ?? ""}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
          />
          <input
            type="date"
            name="hasta"
            defaultValue={params.hasta ?? ""}
            className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-sm"
          />
          <button
            type="submit"
            className="col-span-2 bg-transparent border border-edge text-chalk rounded-[9px] py-2.5 font-display text-sm tracking-[.05em] uppercase cursor-pointer"
          >
            Filtrar
          </button>
        </form>

        <a
          href={`/resultados/export?${qs.toString()}`}
          className="block text-center w-full bg-signal text-[#160800] rounded-[9px] py-3 font-display text-sm tracking-[.09em] uppercase font-semibold mb-4"
        >
          Exportar a Excel
        </a>

        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-2.5">
          Últimas marcas registradas
        </h2>

        {marcas.length === 0 ? (
          <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
            <b className="block text-chalk text-base mb-[5px] font-medium">Aún no hay marcas</b>
            Entra como entrenador y registra algún test para ver aquí lo que
            llega.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="text-left font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
                    Fecha
                  </th>
                  <th className="text-left font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
                    Deportista
                  </th>
                  <th className="text-left font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
                    Prueba
                  </th>
                  <th className="text-right font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
                    Marca
                  </th>
                  <th className="text-left font-display text-xs tracking-[.1em] uppercase text-mute border-b border-edge py-[7px] px-1.5">
                    Por
                  </th>
                </tr>
              </thead>
              <tbody>
                {marcas.map((m) => {
                  const marca =
                    m.metrica === "potencia"
                      ? `${m.potencia_w} W`
                      : m.metrica === "distancia"
                        ? `${m.distancia_m} m`
                        : fmtTiempo(m.tiempo_s);
                  return (
                    <tr key={m.id}>
                      <td className="font-display py-[9px] px-1.5 border-b border-edge/50">
                        {m.fecha.split("-").reverse().slice(0, 2).join("/")}
                      </td>
                      <td className="py-[9px] px-1.5 border-b border-edge/50">{m.deportista}</td>
                      <td className="py-[9px] px-1.5 border-b border-edge/50 text-mute">{m.test}</td>
                      <td className="font-display text-[15px] text-right py-[9px] px-1.5 border-b border-edge/50">
                        {marca}
                      </td>
                      <td className="py-[9px] px-1.5 border-b border-edge/50 text-mute">
                        {(m.registrado_por && nombrePorId.get(m.registrado_por)) ?? ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>
    </AppShell>
  );
}
