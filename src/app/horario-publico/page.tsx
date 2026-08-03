import { createClient } from "@/lib/supabase/server";

const ORDEN_DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function capitaliza(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function HorarioPublicoPage() {
  const supabase = await createClient();
  const { data: horarios, error } = await supabase
    .from("horarios_entrenamiento")
    .select("id, categoria, dia, disciplina, hora_inicio, hora_fin, lugar, notas")
    .order("hora_inicio");

  const categorias = [...new Set((horarios ?? []).map((h) => h.categoria))];

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-[520px] mx-auto px-[18px] py-8">
        <h1 className="font-display text-[20px] font-semibold mb-1">
          C.D.E. Triatlón Alpedrete
        </h1>
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute mb-5">
          Horarios de entrenamientos
        </h2>

        {error && (
          <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
            <b className="block text-[15px] font-medium mb-1 text-run">
              No se ha podido cargar el horario
            </b>
            <p className="text-sm text-mute leading-relaxed">Detalle técnico: {error.message}</p>
          </div>
        )}

        {!error && categorias.length === 0 && (
          <p className="text-mute text-sm">Todavía no hay ningún horario publicado.</p>
        )}

        {!error &&
          categorias.map((cat) => {
            const deCategoria = (horarios ?? []).filter((h) => h.categoria === cat);
            const diasUsados = ORDEN_DIAS.filter((d) => deCategoria.some((h) => h.dia === d));
            return (
              <div key={cat} className="mb-6">
                <h3 className="font-display text-[14px] tracking-[.12em] uppercase text-signal mb-2.5">
                  {cat}
                </h3>
                {diasUsados.map((dia) => (
                  <div key={dia} className="mb-3">
                    <h4 className="font-display text-[12px] tracking-[.1em] uppercase text-mute mb-1.5">
                      {capitaliza(dia)}
                    </h4>
                    {deCategoria
                      .filter((h) => h.dia === dia)
                      .map((h) => (
                        <div
                          key={h.id}
                          className="bg-surf border border-edge rounded-[10px] p-3.5 mb-2"
                        >
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-display text-xs tracking-[.08em] uppercase px-[7px] py-[2px] rounded-[5px] bg-edge text-chalk">
                              {h.disciplina}
                            </span>
                            <span className="font-display text-sm tabular-nums">
                              {h.hora_inicio.slice(0, 5)}
                              {h.hora_fin && `–${h.hora_fin.slice(0, 5)}`}
                            </span>
                          </div>
                          {h.lugar && (
                            <span className="text-xs text-mute block">{h.lugar}</span>
                          )}
                          {h.notas && (
                            <span className="text-xs text-mute block italic">{h.notas}</span>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            );
          })}
      </div>
    </div>
  );
}
