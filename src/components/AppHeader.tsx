"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cambiarMiNombre } from "./perfilActions";

export function AppHeader({
  nombre,
  rol,
}: {
  nombre: string;
  rol: "director" | "entrenador" | "pendiente";
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nombre);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function guardarNombre() {
    setGuardando(true);
    setError(null);
    const resultado = await cambiarMiNombre(valor);
    if ("error" in resultado) {
      setError(resultado.error);
    } else {
      setEditando(false);
      router.refresh();
    }
    setGuardando(false);
  }

  return (
    <header className="bg-surf border-b border-edge px-[18px] pt-[14px] pb-3">
      <div className="flex items-center gap-1.5">
        <img src="/logo-club.png" alt="" className="w-4 h-4 object-contain shrink-0" />
        <div className="font-display text-[13px] tracking-[.16em] uppercase text-mute">
          C.D.E. Triatlón Alpedrete
        </div>
      </div>
      <div className="mt-[3px] flex items-center justify-between gap-2.5">
        {editando ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <input
              autoFocus
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") guardarNombre();
                if (e.key === "Escape") {
                  setValor(nombre);
                  setEditando(false);
                }
              }}
              className="flex-1 min-w-0 bg-deep border border-edge text-chalk rounded-lg px-2.5 py-1.5 text-[15px]"
            />
            <button
              disabled={guardando}
              onClick={guardarNombre}
              className="shrink-0 bg-signal text-[#160800] rounded-lg px-2.5 py-1.5 font-display text-xs uppercase font-semibold cursor-pointer disabled:opacity-60"
            >
              Guardar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0">
            <b className="text-[19px] font-semibold tracking-[-.01em] truncate">{nombre}</b>
            {rol === "director" && (
              <button
                onClick={() => {
                  setValor(nombre);
                  setEditando(true);
                }}
                className="shrink-0 text-mute text-xs underline"
              >
                editar
              </button>
            )}
          </div>
        )}
        {!editando && (
          <div className="flex items-center gap-2 shrink-0">
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
        )}
      </div>
      {editando && error && <p className="text-run text-xs mt-1.5">{error}</p>}
    </header>
  );
}
