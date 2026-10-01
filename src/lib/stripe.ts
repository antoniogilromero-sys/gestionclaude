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

export type CobroStripe = {
  id: string;
  fecha: string;
  importe: number;
  pagador: string;
  descripcion: string;
  estado: "succeeded" | "pending" | "failed";
};

// Listado en directo (nada se guarda) de los cobros reales de la cuenta
// de Stripe del club en un mes concreto — para cobros que Antón gestiona
// él mismo dentro de Stripe (un enlace de pago, una factura manual...),
// sin pasar por el checkout de /cuota ni por `cuotas_stripe`. Se pide a
// Stripe cada vez que se abre la pantalla, igual que el resumen de
// Strava: menos que mantener sincronizado, siempre al día.
export async function listarCobrosMes(mesISO: string): Promise<CobroStripe[]> {
  const stripe = stripeClient();
  const [anio, mes] = mesISO.split("-").map(Number);
  const inicio = Math.floor(new Date(anio, mes - 1, 1).getTime() / 1000);
  const fin = Math.floor(new Date(anio, mes, 1).getTime() / 1000);

  const cobros: CobroStripe[] = [];
  let startingAfter: string | undefined;
  // Un club de este tamaño no debería acercarse a este límite en un mes,
  // pero por si acaso se para a las 300 para no encadenar peticiones sin
  // fin a la API de Stripe.
  for (let pagina = 0; pagina < 3; pagina++) {
    const resultado = await stripe.charges.list({
      created: { gte: inicio, lt: fin },
      limit: 100,
      starting_after: startingAfter,
    });
    for (const c of resultado.data) {
      cobros.push({
        id: c.id,
        fecha: new Date(c.created * 1000).toISOString().slice(0, 10),
        importe: c.amount / 100,
        pagador: c.billing_details?.name || c.billing_details?.email || "Sin nombre",
        descripcion: c.description ?? "",
        estado: c.status === "succeeded" ? "succeeded" : c.status === "failed" ? "failed" : "pending",
      });
    }
    if (!resultado.has_more) break;
    startingAfter = resultado.data[resultado.data.length - 1]?.id;
  }
  return cobros.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
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
