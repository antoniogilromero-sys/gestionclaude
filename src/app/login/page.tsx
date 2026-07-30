import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si ya hay sesión, no tiene sentido volver a pedir el acceso.
  if (user) redirect("/");

  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <header className="bg-surf border-b border-edge px-[18px] pt-[14px] pb-3">
        <div className="font-display text-[13px] tracking-[.16em] uppercase text-mute">
          C.D.E. Triatlón Alpedrete
        </div>
        <div className="mt-[3px] text-[19px] font-semibold tracking-[-.01em]">
          Entrar
        </div>
      </header>
      <div className="lane" />
      <main className="px-[18px] pt-5 pb-[26px]">
        <LoginForm errorInicial={error} />
      </main>
    </div>
  );
}
