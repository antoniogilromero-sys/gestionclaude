import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Cliente de Stripe, para cobrar la cuota mensual de los socios. Solo se
// usa en el servidor (server actions y rutas de API) — la clave secreta
// nunca llega al navegador.
//
// Hacen falta dos variables de entorno en Vercel (y en .env.local si se
// prueba en local):
//   - STRIPE_SECRET_KEY: Dashboard de Stripe > Developers > API keys.
//     Empieza por sk_test_... en modo prueba o sk_live_... en modo real
//     (el modo real no funciona hasta que Stripe termine de verificar la
//     cuenta del club y tenga una cuenta bancaria vinculada).
//   - STRIPE_WEBHOOK_SECRET: Dashboard de Stripe > Developers > Webhooks
//     > Add endpoint (URL: https://triatlonalpedrete.vercel.app/api/stripe/webhook,
//     eventos: checkout.session.completed, customer.subscription.updated,
//     customer.subscription.deleted) > Signing secret (empieza por whsec_...).
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Falta configurar STRIPE_SECRET_KEY");
  return new Stripe(key);
}

// Trae de Stripe el historial real de cobros (facturas) de cada cuota
// guardada y lo deja en `cuotas_pagos`. Se llama bajo demanda (botón
// "Sincronizar pagos" en /cuotas), no por webhook — así funciona también
// con los cobros de antes de que existiera esta tabla, y no depende de
// que Antón vaya a activar un evento nuevo en el Dashboard de Stripe.
export async function sincronizarPagosCuotas(): Promise<{ actualizados: number }> {
  const stripe = stripeClient();
  const supabase = createAdminClient();

  const { data: cuotas } = await supabase
    .from("cuotas_stripe")
    .select("id, stripe_subscription_id")
    .not("stripe_subscription_id", "is", null);

  let actualizados = 0;
  for (const cuota of cuotas ?? []) {
    if (!cuota.stripe_subscription_id) continue;
    const facturas = await stripe.invoices.list({
      subscription: cuota.stripe_subscription_id,
      limit: 24,
    });
    for (const factura of facturas.data) {
      const fecha = new Date((factura.status_transitions?.paid_at ?? factura.created) * 1000);
      const { error } = await supabase.from("cuotas_pagos").upsert(
        {
          cuota_id: cuota.id,
          stripe_invoice_id: factura.id,
          fecha: fecha.toISOString().slice(0, 10),
          importe: (factura.amount_paid || factura.amount_due) / 100,
          estado: factura.status === "paid" ? "pagado" : "pendiente",
        },
        { onConflict: "stripe_invoice_id" },
      );
      if (!error) actualizados++;
    }
  }
  return { actualizados };
}
