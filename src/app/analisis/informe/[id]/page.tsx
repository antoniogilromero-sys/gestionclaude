import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EMISOR } from "@/lib/emisor";
import { obtenerResumenStrava } from "@/lib/strava";
import { fmtTiempo } from "@/lib/formato";
import { ImprimirButton } from "./ImprimirButton";

function fmtFechaLarga(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function fmtFechaCorta(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}/${m}/${y}`;
}

function fmtMinSeg(segundos: number | null) {
  if (segundos == null) return "—";
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Metrica = "tiempo" | "potencia" | "distancia";

function formatValor(
  valor: { tiempo_s: number | null; distancia_m: number | null; potencia_w: number | null },
  metrica: Metrica,
) {
  if (metrica === "potencia") return valor.potencia_w != null ? `${valor.potencia_w} W` : "—";
  if (metrica === "distancia") return valor.distancia_m != null ? `${valor.distancia_m} m` : "—";
  return fmtTiempo(valor.tiempo_s);
}

export default async function InformeDeportistaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deportistaId = Number(id);
  if (!deportistaId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (!perfil || perfil.rol !== "director") redirect("/");

  const [{ data: deportista }, { data: depGrupos }, { data: resultados }, { data: tiposTest }, { data: competiciones }, { data: conexion }] =
    await Promise.all([
      supabase
        .from("deportistas")
        .select(
          "id, nombre, ref, categoria, fc_max_ref, fc_reposo, peso_ref, ftp_ciclismo_w, ftp_carrera_w, ritmo_umbral_s_km",
        )
        .eq("id", deportistaId)
        .maybeSingle(),
      supabase.from("deportista_grupo").select("grupos(nombre)").eq("deportista_id", deportistaId),
      supabase
        .from("resultados_calc")
        .select("fecha, tiempo_s, distancia_m, potencia_w, tipo_test_id")
        .eq("deportista_id", deportistaId)
        .order("fecha", { ascending: true }),
      supabase.from("tipos_test").select("id, nombre, disciplina, metrica, mejor_es"),
      supabase
        .from("competiciones")
        .select("nombre_carrera, fecha, anio, disciplina, tiempo, clasificacion")
        .eq("deportista_id", deportistaId)
        .order("anio", { ascending: false })
        .order("fecha", { ascending: false }),
      supabase.from("strava_conexiones").select("deportista_id").eq("deportista_id", deportistaId).maybeSingle(),
    ]);

  if (!deportista) notFound();

  const grupos = (depGrupos ?? [])
    .map((g) => (g.grupos as unknown as { nombre: string } | null)?.nombre)
    .filter((n): n is string => Boolean(n));

  const tiposPorId = new Map((tiposTest ?? []).map((t) => [t.id, t]));
  const porTest = new Map<
    number,
    { fecha: string; tiempo_s: number | null; distancia_m: number | null; potencia_w: number | null }[]
  >();
  for (const r of resultados ?? []) {
    const arr = porTest.get(r.tipo_test_id) ?? [];
    arr.push(r);
    porTest.set(r.tipo_test_id, arr);
  }

  const mejoresMarcas = [...porTest.entries()]
    .map(([tipoTestId, filas]) => {
      const test = tiposPorId.get(tipoTestId);
      if (!test) return null;
      const valorDe = (f: (typeof filas)[number]) =>
        test.metrica === "potencia" ? f.potencia_w : test.metrica === "distancia" ? f.distancia_m : f.tiempo_s;
      const conValor = filas.filter((f) => valorDe(f) != null);
      if (conValor.length === 0) return null;
      const mejor = conValor.reduce((m, f) =>
        test.mejor_es === "menor"
          ? (valorDe(f)! < valorDe(m)! ? f : m)
          : (valorDe(f)! > valorDe(m)! ? f : m),
      );
      const ultima = conValor[conValor.length - 1];
      return {
        nombre: test.nombre,
        disciplina: test.disciplina,
        metrica: test.metrica as Metrica,
        marcas: conValor.length,
        mejor,
        ultima,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.disciplina.localeCompare(b.disciplina) || a.nombre.localeCompare(b.nombre));

  const strava = conexion ? await obtenerResumenStrava(deportistaId) : null;
  const stravaUltimas4 = strava?.semanas.slice(0, 4) ?? [];
  const stravaKm = stravaUltimas4.reduce((s, w) => s + w.km, 0);
  const stravaHoras = stravaUltimas4.reduce((s, w) => s + w.horas, 0);

  const perfilFisiologico = [
    deportista.fc_max_ref != null && ["FC máx", `${deportista.fc_max_ref} ppm`],
    deportista.fc_reposo != null && ["FC reposo", `${deportista.fc_reposo} ppm`],
    deportista.peso_ref != null && ["Peso", `${deportista.peso_ref} kg`],
    deportista.ftp_ciclismo_w != null && ["FTP ciclismo", `${deportista.ftp_ciclismo_w} W`],
    deportista.ftp_carrera_w != null && ["FTP carrera", `${deportista.ftp_carrera_w} W`],
    deportista.ritmo_umbral_s_km != null && ["Ritmo umbral", `${fmtMinSeg(deportista.ritmo_umbral_s_km)} /km`],
  ].filter((x): x is [string, string] => Boolean(x));

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-[760px] mx-auto px-4 py-6 print:hidden flex items-center justify-between">
        <Link href="/analisis" className="text-mute text-sm">
          ← Análisis
        </Link>
        <ImprimirButton />
      </div>

      <div className="relative overflow-hidden max-w-[760px] mx-auto bg-white text-[#1a1a1a] rounded-lg shadow-2xl mb-10 print:shadow-none print:rounded-none print:mb-0">
        <img
          src="/logo-club.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute left-1/2 top-1/2 w-[480px] h-[480px] object-contain opacity-[0.06] z-0"
          style={{ transform: "translate(-50%, -50%)" }}
        />
        <div className="relative z-10 p-10">
          <div className="flex items-start justify-between gap-6 border-b-2 border-[#1a1a1a] pb-6 mb-6">
            <div className="flex items-start gap-4">
              <img src="/logo-club.png" alt={EMISOR.nombre} className="w-16 h-16 object-contain shrink-0" />
              <div>
                <h1 className="text-2xl font-bold">{EMISOR.nombre}</h1>
                <p className="text-sm mt-1">Informe de deportista</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold">{deportista.nombre}</div>
              <div className="text-sm mt-1">
                {deportista.categoria ?? "—"}
                {grupos.length > 0 && ` · ${grupos.join(", ")}`}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Generado el {fmtFechaLarga(new Date().toISOString().slice(0, 10))}
              </div>
            </div>
          </div>

          {perfilFisiologico.length > 0 && (
            <div className="mb-7">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                Perfil fisiológico
              </div>
              <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
                {perfilFisiologico.map(([label, valor]) => (
                  <div key={label} className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium">{valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-7">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Mejores marcas de la temporada
            </div>
            {mejoresMarcas.length === 0 ? (
              <p className="text-sm text-gray-500">Todavía no tiene resultados de tests registrados.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1a1a1a]">
                    <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-500">Prueba</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-500">Mejor marca</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-500">Última</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-500">Fecha última</th>
                  </tr>
                </thead>
                <tbody>
                  {mejoresMarcas.map((m) => (
                    <tr key={m.nombre} className="border-b border-gray-200">
                      <td className="py-2 pr-2">{m.nombre}</td>
                      <td className="py-2 text-right whitespace-nowrap">{formatValor(m.mejor, m.metrica)}</td>
                      <td className="py-2 text-right whitespace-nowrap">{formatValor(m.ultima, m.metrica)}</td>
                      <td className="py-2 text-right whitespace-nowrap text-gray-500">
                        {fmtFechaCorta(m.ultima.fecha)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mb-7">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
              Competiciones
            </div>
            {!competiciones || competiciones.length === 0 ? (
              <p className="text-sm text-gray-500">Sin competiciones registradas.</p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1a1a1a]">
                    <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-500">Carrera</th>
                    <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-500">Fecha</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-500">Tiempo</th>
                    <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-500">Clasificación</th>
                  </tr>
                </thead>
                <tbody>
                  {competiciones.map((c, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2 pr-2">
                        {c.nombre_carrera}
                        <span className="text-gray-500"> · {c.disciplina}</span>
                      </td>
                      <td className="py-2 whitespace-nowrap">{c.fecha ? fmtFechaCorta(c.fecha) : c.anio}</td>
                      <td className="py-2 text-right whitespace-nowrap">{c.tiempo ?? "—"}</td>
                      <td className="py-2 text-right whitespace-nowrap">{c.clasificacion ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {strava?.conectado && (
            <div className="mb-2">
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                Entrenamiento (Strava, últimas 4 semanas)
              </div>
              <div className="flex gap-8 text-sm mb-2">
                <div>
                  <span className="text-gray-500 block text-xs">KM</span>
                  <span className="font-bold text-lg">{stravaKm.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">HORAS</span>
                  <span className="font-bold text-lg">{stravaHoras.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">SESIONES</span>
                  <span className="font-bold text-lg">
                    {stravaUltimas4.reduce((s, w) => s + w.sesiones, 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-300 pt-4 mt-4">
            Documento de uso interno del club, generado desde la app de gestión. Datos de rendimiento
            deportivo — no incluye información personal sensible.
          </p>
        </div>
      </div>
    </div>
  );
}
