import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la clave de servicio: salta el RLS por completo. SOLO se usa
// en el webhook del Google Forms (server-to-server, sin sesión de usuario
// que comprobar). Nunca lo importes desde un componente de cliente ni
// desde una página normal — para eso está `@/lib/supabase/server`.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
