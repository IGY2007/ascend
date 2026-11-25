import { db } from '@/lib/db'
import { addDays, toDateKey } from '@/domain/dates'
import { waterService } from './activity'

export interface CalendarDay {
  date: string
  workouts: number
  cardioMinutes: number
  waterMl: number
  waterGoalMet: boolean
}

/**
 * Resumen por día de un rango (para la vista de calendario). Lee todo de una vez: son pocas filas
 * por usuario y evita una consulta por día.
 */
export const calendarService = {
  async range(from: string, to: string): Promise<Map<string, CalendarDay>> {
    const [sessions, cardio, water, target] = await Promise.all([
      db.sessions.where('status').equals('completed').toArray(),
      db.cardioLogs.where('date').between(from, to, true, true).toArray(),
      db.waterLogs.where('date').between(from, to, true, true).toArray(),
      waterService.target(),
    ])
    const out = new Map<string, CalendarDay>()
    const day = (date: string) => {
      let d = out.get(date)
      if (!d) {
        d = { date, workouts: 0, cardioMinutes: 0, waterMl: 0, waterGoalMet: false }
        out.set(date, d)
      }
      return d
    }
    for (const s of sessions) {
      const date = toDateKey(new Date(s.startedAt))
      if (date >= from && date <= to) day(date).workouts++
    }
    for (const c of cardio) day(c.date).cardioMinutes += c.minutes
    for (const w of water) day(w.date).waterMl += w.ml
    for (const d of out.values()) d.waterGoalMet = d.waterMl >= target
    return out
  },
}

/** Las celdas de un mes en una grilla que arranca el lunes (con días del mes anterior/siguiente). */
export function monthGrid(year: number, month: number): { date: string; inMonth: boolean }[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const start = addDays(first, -offset)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7
  return Array.from({ length: cells }, (_, i) => {
    const d = addDays(start, i)
    return { date: toDateKey(d), inMonth: d.getMonth() === month }
  })
}
