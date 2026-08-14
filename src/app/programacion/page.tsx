import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { lunesDe, parseLocalDate, toISODateLocal } from "@/lib/date";

// Vista de calendario semanal de /publicar + /entrenamientos: mismos datos
// (tabla `sesiones`), organizados por día en vez de en lista cronológica —
// para ver de un vistazo qué hay programado toda la semana.

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const TAG_DISC: Record<string, string> = {
  natacion: "bg-swim/15 text-swim",
  ciclismo: "bg-bike/15 text-bike",
  carrera: "bg-run/15 text-run",
  fuerza: "bg-signal/15 text-signal",
  combinado: "bg-edge text-chalk",
};
const LABEL_DISC: Record<string, string> = {
  natacion: "Natación",
  ciclismo: "Ciclismo",
  carrera: "Carrera",
  fuerza: "Fuerza",
  combinado: "Combinado",
};

function sumarDias(iso: string, n: number) {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + n);
  return toISODateLocal(d);
}

export default async function ProgramacionPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
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
  if (!perfil || perfil.rol === "pendiente") redirect("/");
  const esDirector = perfil.rol === "director";

  const { semana } = await searchParams;
  const base = semana && /^\d{4}-\d{2}-\d{2}$/.test(semana) ? parseLocalDate(semana) : new Date();
  const lunes = toISODateLocal(lunesDe(base));
  const domingo = sumarDias(lunes, 6);
  const semanaAnterior = sumarDias(lunes, -7);
  const semanaSiguiente = sumarDias(lunes, 7);

  let query = supabase
    .from("sesiones")
    .select("id, fecha, titulo, disciplina, material, publicada, sesion_grupo(grupos(nombre))")
    .gte("fecha", lunes)
    .lte("fecha", domingo)
    .order("fecha", { ascending: true });
  if (!esDirector) query = query.eq("publicada", true);

  const { data: sesiones, error } = await query;

  const diasDelaSemana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Programación
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/programacion?semana=${semanaAnterior}`}
            className="min-h-[38px] px-2.5 flex items-center justify-center rounded-lg border border-edge text-mute font-display text-xs cursor-pointer"
          >
            ◀
          </Link>
          <Link
            href="/programacion"
            className="min-h-[38px] px-2.5 flex items-center justify-center rounded-lg border border-edge text-mute font-display text-[11px] tracking-[.06em] uppercase cursor-pointer"
          >
            Hoy
          </Link>
          <Link
            href={`/programacion?semana=${semanaSiguiente}`}
            className="min-h-[38px] px-2.5 flex items-center justify-center rounded-lg border border-edge text-mute font-display text-xs cursor-pointer"
          >
            ▶
          </Link>
        </div>
      </div>

      <p className="text-xs text-mute mb-3.5">
        {lunes.split("-").reverse().join("/")} – {domingo.split("-").reverse().join("/")}
      </p>

      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">No se ha podido cargar</b>
          <p className="text-sm text-mute leading-relaxed">Detalle técnico: {error.message}</p>
        </div>
      ) : (
        diasDelaSemana.map((fecha, i) => {
          const deEseDia = (sesiones ?? []).filter((s) => s.fecha === fecha);
          const esHoy = fecha === toISODateLocal(new Date());
          return (
            <div key={fecha} className="mb-4">
              <h3
                className={`font-display text-[12px] tracking-[.1em] uppercase mb-1.5 ${
                  esHoy ? "text-signal" : "text-mute"
                }`}
              >
                {DIAS[i]} · {fecha.split("-").reverse().slice(0, 2).join("/")}
                {esHoy && " · hoy"}
              </h3>
              {deEseDia.length === 0 ? (
                <p className="text-mute text-xs pl-1">Sin nada programado.</p>
              ) : (
                deEseDia.map((s) => {
                  const grupos = (s.sesion_grupo as unknown as { grupos: { nombre: string } | null }[])
                    .map((sg) => sg.grupos?.nombre)
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <Link
                      key={s.id}
                      href="/entrenamientos"
                      className="block bg-surf border border-edge rounded-[10px] p-3 mb-1.5"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px] ${TAG_DISC[s.disciplina] ?? "bg-edge text-chalk"}`}
                        >
                          {LABEL_DISC[s.disciplina] ?? s.disciplina}
                        </span>
                        {esDirector && !s.publicada && (
                          <span className="font-display text-[11px] tracking-[.06em] uppercase px-[7px] py-[2px] rounded-[5px] bg-edge text-mute">
                            Borrador
                          </span>
                        )}
                      </div>
                      <b className="block text-sm font-medium">{s.titulo}</b>
                      {grupos && <span className="text-xs text-mute block mt-0.5">{grupos}</span>}
                    </Link>
                  );
                })
              )}
            </div>
          );
        })
      )}
    </AppShell>
  );
}
