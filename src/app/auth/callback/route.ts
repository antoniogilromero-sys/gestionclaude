import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Detrás del proxy de Vercel, el origin de la petición es el host interno,
  // no gestionclaude.vercel.app: sin esto, el enlace de acceso acabaría
  // redirigiendo a una dirección que el navegador no reconoce.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const enLocal = process.env.NODE_ENV === "development";
  const base = enLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(base);
    }
  }

  return NextResponse.redirect(`${base}/login?error=auth`);
}
