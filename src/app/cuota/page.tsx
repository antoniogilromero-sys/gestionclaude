import { CuotaForm } from "./CuotaForm";

// Página pública, sin login — la familia la abre desde un enlace que le
// manda el club (igual que /horario-publico y /strava-conectar/[id]) y
// paga la cuota mensual del club por Stripe, sin necesitar cuenta en la
// app (los deportistas nunca han tenido cuenta aquí).
export default function CuotaPage() {
  return (
    <div className="min-h-screen bg-deep flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <h1 className="font-display text-xl tracking-[.04em] text-chalk mb-1 text-center">
          C.D.E. Triatlón Alpedrete
        </h1>
        <p className="text-mute text-sm text-center mb-6">Cuota mensual del club</p>
        <CuotaForm />
      </div>
    </div>
  );
}
