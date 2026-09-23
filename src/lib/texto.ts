// Quita acentos de una cadena, para comparar texto sin importar la
// tilde — así buscar "martin" también encuentra a "Martín". Es el
// equivalente en JS de unaccent() en Postgres, que ya se usa en todo el
// SQL de este proyecto para lo mismo.
export function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
