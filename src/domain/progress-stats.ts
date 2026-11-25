import { addDays, fromDateKey, startOfWeek, toDateKey } from './dates'

/**
 * Series semanales y mensajes de progreso. Todo se calcula con datos reales: si no hay datos
 * suficientes para comparar, no se inventa un mensaje.
 */

export interface DatedValue {
  date: string // AAAA-MM-DD
  value: number
}

export interface WeekBucket {
  weekStart: string // lunes AAAA-MM-DD
  value: number
}

/** Suma por semana (lunes a domingo) de las últimas `weeks` semanas, incluida la actual. */
export function weeklySums(items: DatedValue[], today: string, weeks: number): WeekBucket[] {
  const current = startOfWeek(fromDateKey(today))
  const buckets: WeekBucket[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(current, -7 * i)
    const startKey = toDateKey(start)
    const endKey = toDateKey(addDays(start, 6))
    buckets.push({
      weekStart: startKey,
      value: items
        .filter((it) => it.date >= startKey && it.date <= endKey)
        .reduce((s, it) => s + it.value, 0),
    })
  }
  return buckets
}

/** Suma por día de los últimos `days` días, incluido hoy. */
export function dailySums(items: DatedValue[], today: string, days: number): DatedValue[] {
  const end = fromDateKey(today)
  const out: DatedValue[] = []
  for (let i = days - 1; i >= 0; i--) {
    const key = toDateKey(addDays(end, -i))
    out.push({
      date: key,
      value: items.filter((it) => it.date === key).reduce((s, it) => s + it.value, 0),
    })
  }
  return out
}

/** Semanas seguidas (terminando en la anterior a la actual, o la actual si ya cumplió) cumpliendo la meta. */
export function weekStreak(sessionDates: string[], today: string, goalPerWeek: number): number {
  if (goalPerWeek <= 0) return 0
  const weeks = weeklySums(
    sessionDates.map((d) => ({ date: d, value: 1 })),
    today,
    52,
  )
  let streak = 0
  const last = weeks.length - 1
  // La semana actual cuenta solo si ya se cumplió; si no, no corta la racha.
  let i = weeks[last]!.value >= goalPerWeek ? last : last - 1
  for (; i >= 0; i--) {
    if (weeks[i]!.value >= goalPerWeek) streak++
    else break
  }
  return streak
}

export const pctChange = (now: number, before: number): number | null =>
  before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null

export type InsightKind =
  | 'volume_up'
  | 'volume_down'
  | 'strength_up'
  | 'weight_change'
  | 'streak'
  | 'records'
  | 'cardio'
  | 'week_goal'

export interface Insight {
  kind: InsightKind
  /** Texto final en español (ya formateado) */
  text: string
  /** true = logro para celebrar */
  positive: boolean
}
