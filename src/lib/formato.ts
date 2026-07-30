export function fmtTiempo(s: number | null | undefined) {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const g = Math.round(s % 60);
  return `${m}'${String(g).padStart(2, "0")}"`;
}

export function fmtFecha(iso: string) {
  const partes = iso.split("-");
  return `${partes[2]}/${partes[1]}`;
}
