import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export default async function FacturasPage() {
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

  const { data: facturas, error } = await supabase
    .from("facturas")
    .select("numero, fecha, pagador_nombre, concepto, importe")
    .order("numero", { ascending: false });

  const total = (facturas ?? []).reduce((s, f) => s + Number(f.importe), 0);

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Facturas
        </h2>
        <Link
          href="/facturas/nueva"
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
            Puede que falte ejecutar la migración de facturas en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      )}

      {!error && facturas && facturas.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
            <b className="font-display text-[26px] block leading-none">{facturas.length}</b>
            <span className="text-[11px] text-mute tracking-[.04em]">FACTURAS</span>
          </div>
          <div className="bg-surf border border-edge rounded-[10px] p-[11px]">
            <b className="font-display text-[26px] block leading-none">
              {total.toFixed(2)} €
            </b>
            <span className="text-[11px] text-mute tracking-[.04em]">TOTAL</span>
          </div>
        </div>
      )}

      {!error && (!facturas || facturas.length === 0) ? (
        <div className="text-center py-9 px-5 text-mute text-sm leading-relaxed">
          <b className="block text-chalk text-base mb-[5px] font-medium">
            Todavía no hay ninguna
          </b>
          La numeración sigue desde la 65. Emite la primera cuando quieras.
        </div>
      ) : (
        (facturas ?? []).map((f) => (
          <Link
            key={f.numero}
            href={`/facturas/${f.numero}`}
            className="flex items-center justify-between gap-2 bg-surf border border-edge rounded-[10px] p-3.5 mb-2.5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-mute text-sm">Nº {f.numero}</span>
                <span className="text-mute text-xs">
                  {f.fecha.split("-").reverse().slice(0, 2).join("/")}
                </span>
              </div>
              <b className="block text-[15px] font-medium truncate">{f.pagador_nombre}</b>
              <span className="text-xs text-mute truncate block">{f.concepto}</span>
            </div>
            <span className="shrink-0 font-display text-[17px] font-semibold">
              {Number(f.importe).toFixed(2)} €
            </span>
          </Link>
        ))
      )}
    </AppShell>
  );
}
