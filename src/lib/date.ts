export function toISODateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function lunesDe(d: Date) {
  const dia = d.getDay(); // 0=domingo..6=sábado
  const diff = (dia === 0 ? -6 : 1) - dia;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}
