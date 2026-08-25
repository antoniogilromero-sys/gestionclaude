import Stripe from "stripe";

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
