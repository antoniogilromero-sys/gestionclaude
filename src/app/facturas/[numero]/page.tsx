import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EMISOR, EXENCION_IVA } from "@/lib/emisor";
import { PrintButton } from "./PrintButton";

function fmtFechaLarga(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export default async function FacturaPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
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

  const { data: factura } = await supabase
    .from("facturas")
    .select("numero, fecha, pagador_nombre, pagador_nif, pagador_direccion, concepto, importe")
    .eq("numero", Number(numero))
    .single();

  if (!factura) notFound();

  return (
    <div className="min-h-screen bg-deep">
      <div className="max-w-[700px] mx-auto px-4 py-6 print:hidden flex items-center justify-between">
        <Link href="/facturas" className="text-mute text-sm">
          ← Facturas
        </Link>
        <PrintButton />
      </div>

      <div className="relative overflow-hidden max-w-[700px] mx-auto bg-white text-[#1a1a1a] rounded-lg shadow-2xl mb-10 print:shadow-none print:rounded-none print:mb-0">
        {/* Marca de agua: <img> real (no CSS background) para que salga también al imprimir. */}
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
              <img
                src="/logo-club.png"
                alt={EMISOR.nombre}
                className="w-16 h-16 object-contain shrink-0"
              />
              <div>
                <h1 className="text-2xl font-bold">{EMISOR.nombre}</h1>
                <p className="text-sm mt-1">NIF {EMISOR.nif}</p>
                <p className="text-sm">{EMISOR.direccion}</p>
                <p className="text-sm">{EMISOR.poblacion}</p>
                <p className="text-sm">{EMISOR.email}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs uppercase tracking-wider text-gray-500">Factura</div>
              <div className="text-3xl font-bold">Nº {factura.numero}</div>
              <div className="text-sm mt-1">{fmtFechaLarga(factura.fecha)}</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
              Datos del cliente
            </div>
            <p className="font-semibold">{factura.pagador_nombre}</p>
            <p className="text-sm">NIF/DNI: {factura.pagador_nif}</p>
            {factura.pagador_direccion && <p className="text-sm">{factura.pagador_direccion}</p>}
          </div>

          <table className="w-full border-collapse mb-2">
            <thead>
              <tr className="border-b-2 border-[#1a1a1a]">
                <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-500">
                  Concepto
                </th>
                <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-500">
                  Importe
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="py-3 pr-4">{factura.concepto}</td>
                <td className="py-3 text-right whitespace-nowrap">
                  {Number(factura.importe).toFixed(2)} €
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-56">
              <div className="flex justify-between py-1 text-sm text-gray-600">
                <span>Base imponible</span>
                <span>{Number(factura.importe).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between py-1 text-sm text-gray-600">
                <span>IVA</span>
                <span>Exento</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-[#1a1a1a] font-bold text-lg mt-1">
                <span>Total</span>
                <span>{Number(factura.importe).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-300 pt-4">
            {EXENCION_IVA}
          </p>
        </div>
      </div>
    </div>
  );
}
