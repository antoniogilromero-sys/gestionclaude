"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <div className="bg-surf border-b border-edge px-[18px] pt-[14px] pb-3">
        <div className="font-display text-[13px] tracking-[.16em] uppercase text-mute">
          C.D.E. Triatlón Alpedrete
        </div>
        <div className="mt-[3px] text-[19px] font-semibold tracking-[-.01em]">
          Algo ha fallado
        </div>
      </div>
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        <p className="text-sm text-chalk/90 leading-relaxed mb-4">
          No se ha podido cargar esta pantalla. Suele ser un corte de conexión
          momentáneo: prueba a reintentar. Si sigue pasando, avisa y lo miramos.
        </p>
        <button
          onClick={reset}
          className="w-full bg-signal text-[#160800] rounded-[9px] py-3.5 font-display text-[17px] tracking-[.09em] uppercase font-semibold cursor-pointer"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="block text-center w-full bg-transparent border border-edge text-chalk rounded-[9px] py-3 font-display text-[15px] tracking-[.07em] uppercase mt-2.5"
        >
          Volver al inicio
        </Link>
        {error.digest && (
          <p className="text-xs text-mute mt-4 pt-3 border-t border-edge">
            Referencia del fallo: {error.digest}
          </p>
        )}
      </main>
    </div>
  );
}
