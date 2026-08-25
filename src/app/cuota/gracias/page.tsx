export default function CuotaGraciasPage() {
  return (
    <div className="min-h-screen bg-deep flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-surf border border-edge rounded-[14px] p-6 text-center">
        <h1 className="font-display text-lg tracking-[.04em] text-chalk mb-2">¡Gracias!</h1>
        <p className="text-mute text-sm leading-relaxed">
          Tu cuota mensual ha quedado configurada correctamente. Se cobrará automáticamente cada
          mes hasta que se cancele. Ya puedes cerrar esta página.
        </p>
      </div>
    </div>
  );
}
