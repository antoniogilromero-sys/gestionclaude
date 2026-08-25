import { NextRequest, NextResponse } from "next/server";
import { stripeClient } from "@/lib/stripe";

// Crea una sesión de Stripe Checkout en modo suscripción (cobro mensual
// automático) para la cuota del club, y devuelve la URL a la que
// redirigir al navegador. La llama la página pública /cuota — no hace
// falta estar registrado en la app, es la familia quien paga.
//
// Los importes son fijos (44€ o 30€, los dos únicos que hay en el club)
// y se crean "al vuelo" con price_data en vez de tener que dar de alta
// productos en el Dashboard de Stripe primero — así no hace falta
// ninguna configuración extra en Stripe aparte de las claves de API.

const IMPORTES_VALIDOS = [44, 30];
const SITE_URL = "https://triatlonalpedrete.vercel.app";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const importe = Number(body.importe);

  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre del deportista" }, { status: 400 });
  }
  if (!IMPORTES_VALIDOS.includes(importe)) {
    return NextResponse.json({ error: "Importe de cuota no válido" }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: importe * 100,
            recurring: { interval: "month" },
            product_data: {
              name: `Cuota mensual C.D.E. Triatlón Alpedrete — ${nombre}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { nombre_deportista: nombre, importe: String(importe) },
      subscription_data: {
        metadata: { nombre_deportista: nombre, importe: String(importe) },
      },
      success_url: `${SITE_URL}/cuota/gracias`,
      cancel_url: `${SITE_URL}/cuota`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe no devolvió una URL de pago" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear el pago con Stripe" },
      { status: 500 },
    );
  }
}
