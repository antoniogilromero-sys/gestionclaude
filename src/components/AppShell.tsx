import { AppHeader } from "./AppHeader";
import { NavBar } from "./NavBar";

export function AppShell({
  nombre,
  rol,
  children,
}: {
  nombre: string;
  rol: "director" | "entrenador" | "pendiente";
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <AppHeader nombre={nombre} rol={rol} />
      <NavBar rol={rol} />
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px] flex-1">{children}</main>
    </div>
  );
}
