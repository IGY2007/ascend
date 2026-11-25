/**
 * Fechas "de calendario" (AAAA-MM-DD) siempre en hora LOCAL del dispositivo.
 * Nunca usar toISOString() para esto: en zonas adelantadas a UTC (ej. Noruega) corre el día.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** AAAA-MM-DD → Date a las 00:00 locales. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** Lunes de la semana de `date` (semana de lunes a domingo). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (d.getDay() + 6) % 7
  return addDays(d, -offset)
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((fromDateKey(toKey).getTime() - fromDateKey(fromKey).getTime()) / 86_400_000)
}
