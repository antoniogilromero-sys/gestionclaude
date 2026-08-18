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

  const [
    { data: movimientos, error },
    { data: facturas },
    { data: pagosExtra },
    { data: movimientosTodos },
    { data: facturasTodas },
    { data: pagosExtraTodos },
  ] = await Promise.all([
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
    // Para la media mensual hace falta todo el histórico, no solo el mes
    // que se está viendo.
    supabase.from("movimientos_club").select("tipo, importe, fecha"),
    supabase.from("facturas").select("importe, fecha"),
    supabase.from("pagos_extra").select("importe, mes"),
  ]);

  const porMes = new Map<string, { ingresos: number; gastos: number }>();
  function sumar(claveMes: string, tipo: "ingreso" | "gasto", importe: number) {
    const acc = porMes.get(claveMes) ?? { ingresos: 0, gastos: 0 };
    if (tipo === "ingreso") acc.ingresos += importe;
    else acc.gastos += importe;
    porMes.set(claveMes, acc);
  }
  for (const m of movimientosTodos ?? []) sumar(m.fecha.slice(0, 7), m.tipo as "ingreso" | "gasto", Number(m.importe));
  for (const f of facturasTodas ?? []) sumar(f.fecha.slice(0, 7), "ingreso", Number(f.importe));
  for (const p of pagosExtraTodos ?? []) sumar(p.mes.slice(0, 7), "gasto", Number(p.importe));

  const meses = [...porMes.values()];
  const mediaIngresos = meses.length > 0 ? meses.reduce((s, m) => s + m.ingresos, 0) / meses.length : 0;
  const mediaGastos = meses.length > 0 ? meses.reduce((s, m) => s + m.gastos, 0) / meses.length : 0;

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
          mediaIngresos={mediaIngresos}
          mediaGastos={mediaGastos}
          mesesConDatos={meses.length}
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
