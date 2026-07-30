"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AppHeader({
  nombre,
  rol,
}: {
  nombre: string;
  rol: "director" | "entrenador" | "pendiente";
}) {
  const router = useRouter();

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-surf border-b border-edge px-[18px] pt-[14px] pb-3">
      <div className="font-display text-[13px] tracking-[.16em] uppercase text-mute">
        C.D.E. Triatlón Alpedrete
      </div>
      <div className="mt-[3px] flex items-center justify-between gap-2.5">
        <b className="text-[19px] font-semibold tracking-[-.01em]">{nombre}</b>
        <div className="flex items-center gap-2">
          <span
            className={`font-display text-xs tracking-[.1em] uppercase px-2 py-[3px] rounded-full ${
              rol === "director" ? "bg-signal text-[#160800]" : "bg-edge text-chalk"
            }`}
          >
            {rol === "director" ? "Director técnico" : rol === "entrenador" ? "Entrenador" : "Pendiente"}
          </span>
          <button
            onClick={salir}
            className="bg-transparent border border-edge text-mute rounded-lg px-2.5 py-1 text-[11px] cursor-pointer hover:text-chalk hover:border-mute"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
