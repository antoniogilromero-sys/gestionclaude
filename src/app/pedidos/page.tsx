import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { PedidosList } from "./PedidosList";
import { DocumentosPedido } from "./DocumentosPedido";

export default async function PedidosPage() {
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

  const [{ data: pedidos, error }, { data: documentos }] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id, articulo, talla, cantidad, creado_en, deportistas(nombre)")
      .order("creado_en", { ascending: false }),
    supabase
      .from("pedidos_documentos")
      .select("id, nombre, storage_path, creado_en")
      .order("creado_en", { ascending: false }),
  ]);

  const pedidosLimpios = (pedidos ?? []).map((p) => {
    const d = p.deportistas as unknown as { nombre: string } | { nombre: string }[] | null;
    const deportistaNombre = Array.isArray(d) ? (d[0]?.nombre ?? "?") : (d?.nombre ?? "?");
    return {
      id: p.id as number,
      articulo: p.articulo as "camiseta" | "sudadera",
      talla: p.talla as string,
      cantidad: p.cantidad as number,
      creado_en: p.creado_en as string,
      deportistaNombre,
    };
  });

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="font-display text-[14px] tracking-[.14em] uppercase text-mute">
          Pedidos
        </h2>
        <Link
          href="/pedidos/nuevo"
          className="font-display text-xs tracking-[.08em] uppercase text-signal"
        >
          + Nuevo
        </Link>
      </div>

      {error && (
        <div className="bg-surf border border-run/40 rounded-[10px] p-3.5 mb-4">
          <b className="block text-[15px] font-medium mb-1 text-run">
            No se ha podido cargar el listado
          </b>
          <p className="text-sm text-mute leading-relaxed">
            Puede que falte ejecutar la migración de pedidos en Supabase.
            Detalle técnico: {error.message}
          </p>
        </div>
      )}

      <DocumentosPedido documentos={documentos ?? []} />

      {!error && <PedidosList pedidos={pedidosLimpios} />}
    </AppShell>
  );
}
