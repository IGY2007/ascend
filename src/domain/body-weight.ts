import { addDays, fromDateKey, toDateKey } from './dates'

export interface WeightPoint {
  date: string // AAAA-MM-DD local
  weightKg: number
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const round1 = (n: number) => Math.round(n * 10) / 10

/** Promedio de los registros en los 7 días que terminan en `endKey` (inclusive). */
export function weeklyAverage(points: WeightPoint[], endKey: string): number | null {
  const end = fromDateKey(endKey)
  const startKey = toDateKey(addDays(end, -6))
  const values = points.filter((p) => p.date >= startKey && p.date <= endKey).map((p) => p.weightKg)
  const a = avg(values)
  return a === null ? null : round1(a)
}

export interface WeightStats {
  latest: WeightPoint | null
  /** Promedio de los últimos 7 días */
  weekAvg: number | null
  /** Promedio de los últimos 7 días menos el de los 7 anteriores */
  weekChange: number | null
  /** Último registro menos el primero */
  totalChange: number | null
  /** Kg que faltan para el objetivo (positivo = subir, negativo = bajar) */
  toTarget: number | null
}

export function weightStats(
  points: WeightPoint[],
  today: string,
  targetKg: number | null,
): WeightStats {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const latest = sorted.at(-1) ?? null
  const first = sorted[0] ?? null
  const weekAvg = weeklyAverage(sorted, today)
  const prevAvg = weeklyAverage(sorted, toDateKey(addDays(fromDateKey(today), -7)))
  return {
    latest,
    weekAvg,
    weekChange: weekAvg !== null && prevAvg !== null ? round1(weekAvg - prevAvg) : null,
    totalChange:
      latest && first && sorted.length > 1 ? round1(latest.weightKg - first.weightKg) : null,
    toTarget: latest && targetKg != null ? round1(targetKg - latest.weightKg) : null,
  }
}

/** Puntos dentro de los últimos `days` días (null = todos). */
export function filterRange(
  points: WeightPoint[],
  today: string,
  days: number | null,
): WeightPoint[] {
  if (days === null) return points
  const from = toDateKey(addDays(fromDateKey(today), -(days - 1)))
  return points.filter((p) => p.date >= from && p.date <= today)
}
