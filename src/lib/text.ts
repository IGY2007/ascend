/** Minúsculas y sin tildes, para buscar "jalon" o "JALÓN" igual. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
