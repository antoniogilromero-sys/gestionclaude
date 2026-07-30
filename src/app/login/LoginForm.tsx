"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.42 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function LoginForm({ errorInicial }: { errorInicial?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    errorInicial === "auth"
      ? "El enlace de acceso ya no vale (puede haber caducado o haberse usado antes). Pide uno nuevo."
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);

  async function entrarConGoogle() {
    setCargandoGoogle(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setCargandoGoogle(false);
      setError(`No se pudo entrar con Google: ${error.message}`);
    }
    // Si va bien, el navegador se va a Google: no hace falta quitar el "cargando".
  }

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
    if (error) {
      setError(
        error.message.includes("rate limit")
          ? "Se han enviado demasiados correos seguidos. Espera un rato o entra con Google."
          : `No se pudo enviar el enlace: ${error.message}`,
      );
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="bg-surf border border-edge rounded-[10px] p-3.5">
        <b className="block text-[16px] font-semibold mb-1">Revisa tu correo</b>
        <p className="text-sm text-chalk/90">
          Te hemos enviado un enlace de acceso a <b>{email}</b>. Ábrelo desde
          este mismo dispositivo para entrar.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-mute text-sm underline mt-3"
        >
          Usar otro correo
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={entrarConGoogle}
        disabled={cargandoGoogle}
        className="w-full flex items-center justify-center gap-2.5 bg-chalk text-[#1a1a1a] rounded-[9px] py-3.5 font-medium text-[15px] cursor-pointer disabled:opacity-60"
      >
        <GoogleIcon />
        {cargandoGoogle ? "Abriendo Google…" : "Entrar con Google"}
      </button>

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-edge" />
        <span className="font-display text-xs tracking-[.1em] uppercase text-mute">
          o con tu correo
        </span>
        <span className="flex-1 h-px bg-edge" />
      </div>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="email"
          className="block font-display text-[13px] tracking-[.1em] uppercase text-mute mb-[5px]"
        >
          Correo
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-deep border border-edge text-chalk rounded-lg p-[11px] text-[15px] focus:outline-2 focus:outline-signal focus:-outline-offset-1 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-[15px] tracking-[.07em] uppercase cursor-pointer mt-3 disabled:opacity-60"
        >
          {loading ? "Enviando…" : "Enviar enlace de acceso"}
        </button>
      </form>

      {error && (
        <p className="text-run text-sm mt-3" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-mute leading-relaxed mt-4 pt-3 border-t border-edge">
        Si es tu primera vez, se crea tu cuenta automáticamente con el rol
        &quot;pendiente&quot;: no verás nada hasta que el director técnico te
        apruebe.
      </p>
    </>
  );
}
