import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { NuevoPedidoForm } from "../NuevoPedidoForm";

export default async function NuevoPedidoPage() {
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

  const { data: deportistas } = await supabase
    .from("deportistas")
    .select("id, nombre, categoria")
    .eq("activo", true)
    .order("nombre");

  return (
    <AppShell nombre={perfil.nombre} rol={perfil.rol}>
      <NuevoPedidoForm deportistas={deportistas ?? []} />
    </AppShell>
  );
}
