import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { toISODateLocal, parseLocalDate } from "@/lib/date";
import { BalanceView } from "./BalanceView";

function primerDiaMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function ultimoDiaMes(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export default async function BalancePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
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
  const mesDate = params.mes ? primerDiaMes(parseLocalDate(params.mes)) : primerDiaMes(new Date());
  const mes = toISODateLocal(mesDate);
  const mesFin = toISODateLocal(ultimoDiaMes(mesDate));
  const anteriorDate = new Date(mesDate.getFullYear(), mesDate.getMonth() - 1, 1);
  const siguienteDate = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 1);

  const [{ data: movimientos, error }, { data: facturas }, { data: pagosExtra }] = await Promise.all([
    supabase
      .from("movimientos_club")
      .select("id, tipo, categoria, concepto, importe, fecha")
      .gte("fecha", mes)
      .lte("fecha", mesFin)
      .order("fecha", { ascending: false }),
    supabase.from("facturas").select("numero, importe, fecha").gte("fecha", mes).lte("fecha", mesFin),
    supabase
      .from("pagos_extra")
      .select("id, concepto, importe")
      .eq("mes", mes),
  ]);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      {error ? (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el balance
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de movimientos_club en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      ) : (
        <BalanceView
          mes={mes}
          mesAnterior={toISODateLocal(anteriorDate)}
          mesSiguiente={toISODateLocal(siguienteDate)}
          movimientos={movimientos ?? []}
          facturas={(facturas ?? []).map((f) => ({
            id: f.numero,
            concepto: `Factura nº ${f.numero}`,
            importe: Number(f.importe),
          }))}
          pagosExtra={(pagosExtra ?? []).map((p) => ({
            id: p.id,
            concepto: p.concepto,
            importe: Number(p.importe),
          }))}
        />
      )}
    </AppShell>
  );
}
