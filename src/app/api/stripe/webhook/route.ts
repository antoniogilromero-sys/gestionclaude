import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Recibe los avisos de Stripe sobre la cuota mensual: cuando alguien
// completa el pago (se da de alta), cuando se cancela la suscripción, o
// cuando falla un cobro. Nunca lanza: siempre responde 200 salvo que la
// firma no sea válida, para que Stripe no reintente sin parar por un
// fallo nuestro que no tiene arreglo reintentando.
//
// Hay que darlo de alta en Stripe: Dashboard > Developers > Webhooks >
// Add endpoint, URL https://triatlonalpedrete.vercel.app/api/stripe/webhook,
// eventos: checkout.session.completed, customer.subscription.updated,
// customer.subscription.deleted.

export async function POST(request: NextRequest) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: "Falta configurar STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const firma = request.headers.get("stripe-signature");
  const cuerpoCrudo = await request.text();

  let evento: Stripe.Event;
  try {
    const stripe = stripeClient();
    evento = stripe.webhooks.constructEvent(cuerpoCrudo, firma ?? "", secreto);
  } catch (err) {
    return NextResponse.json(
      { error: `Firma inválida: ${err instanceof Error ? err.message : "desconocido"}` },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  try {
    if (evento.type === "checkout.session.completed") {
      const session = evento.data.object as Stripe.Checkout.Session;
      const nombre = session.metadata?.nombre_deportista ?? "Sin nombre";
      const importe = Number(session.metadata?.importe ?? 0);
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

      await supabase.from("cuotas_stripe").upsert(
        {
          nombre_deportista: nombre,
          importe,
          stripe_customer_id: customerId ?? null,
          stripe_subscription_id: subscriptionId ?? null,
          estado: "activa",
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: "stripe_subscription_id" },
      );
    }

    if (evento.type === "customer.subscription.updated" || evento.type === "customer.subscription.deleted") {
      const sub = evento.data.object as Stripe.Subscription;
      const estado =
        evento.type === "customer.subscription.deleted"
          ? "cancelada"
          : sub.status === "past_due" || sub.status === "unpaid"
            ? "impago"
            : sub.status === "active"
              ? "activa"
              : sub.status;

      await supabase
        .from("cuotas_stripe")
        .update({ estado, actualizado_en: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);
    }
  } catch (e) {
    console.error("Fallo procesando webhook de Stripe:", e);
    // No se devuelve error a Stripe por esto: el pago ya se ha hecho de
    // verdad, lo que falla es solo nuestro registro. Queda en los logs
    // de Vercel para revisarlo a mano si hace falta.
  }

  return NextResponse.json({ received: true });
}
