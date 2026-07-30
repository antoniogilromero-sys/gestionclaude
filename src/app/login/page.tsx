"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <header className="bg-surf border-b border-edge px-[18px] pt-[14px] pb-3">
        <div className="font-display text-[13px] tracking-[.16em] uppercase text-mute">
          C.D.E. Triatlón Alpedrete
        </div>
        <div className="mt-[3px] text-[19px] font-semibold tracking-[-.01em]">
          Entrar
        </div>
      </header>
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        {sent ? (
          <div className="bg-surf border border-edge rounded-[10px] p-3.5">
            <b className="block text-[16px] font-semibold mb-1">Revisa tu correo</b>
            <p className="text-sm text-chalk/90">
              Te hemos enviado un enlace de acceso a <b>{email}</b>. Ábrelo desde
              este mismo dispositivo para entrar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="email"
              className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mt-3 mb-[5px]"
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px] focus:outline-2 focus:outline-signal focus:-outline-offset-1 focus:border-transparent"
            />
            {error && (
              <p className="text-run text-sm mt-2">
                No se pudo enviar el enlace: {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer mt-4 disabled:opacity-60"
            >
              {loading ? "Enviando…" : "Enviar enlace de acceso"}
            </button>
            <p className="text-xs text-mute leading-relaxed mt-3.5 pt-3 border-t border-edge">
              Si es tu primera vez, se crea tu cuenta automáticamente con el
              rol &quot;pendiente&quot;: no verás nada hasta que el director
              técnico te apruebe.
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
