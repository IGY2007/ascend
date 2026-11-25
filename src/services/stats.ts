import { db } from '@/lib/db'
import { addDays, toDateKey } from '@/domain/dates'
import { bestSet, isWorkingSet, maxWeight, totalVolume } from '@/domain/workout'
import {
  dailySums,
  pctChange,
  weekStreak,
  weeklySums,
  type DatedValue,
  type WeekBucket,
} from '@/domain/progress-stats'
import { weightStats } from '@/domain/body-weight'
import type { Exercise, ExerciseSet, Goal, WorkoutSession } from '@/types/models'
import { bodyWeightService, exercisesService } from './local-data'
import { historyService } from './workout'

/**
 * Estadísticas para los gráficos y los mensajes de progreso. Solo datos reales.
 */

export interface ExercisePoint {
  date: string
  e1rm: number
  maxWeight: number
  volume: number
}

export interface ExerciseSummary {
  exercise: Exercise
  sessions: number
  lastDate: string
  best: number
}

async function completedSessions(): Promise<WorkoutSession[]> {
  return (await db.sessions.where('status').equals('completed').toArray()).sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt),
  )
}

async function setsByExercise(): Promise<
  Map<string, { session: WorkoutSession; sets: ExerciseSet[] }[]>
> {
  const sessions = await completedSessions()
  const byId = new Map(sessions.map((s) => [s.id, s]))
  const ses = (await db.sessionExercises.toArray()).filter(
    (se) => byId.has(se.sessionId) && se.exerciseId,
  )
  const sets = await db.exerciseSets.toArray()
  const map = new Map<string, { session: WorkoutSession; sets: ExerciseSet[] }[]>()
  for (const se of ses) {
    const list = map.get(se.exerciseId!) ?? []
    list.push({
      session: byId.get(se.sessionId)!,
      sets: sets.filter((x) => x.sessionExerciseId === se.id && isWorkingSet(x)),
    })
    map.set(se.exerciseId!, list)
  }
  for (const list of map.values())
    list.sort((a, b) => a.session.startedAt.localeCompare(b.session.startedAt))
  return map
}

export interface Insights {
  weekGoal: { done: number; goal: number } | null
  streak: number
  volumePct: number | null
  strength: { exerciseName: string; pct: number; from: number; to: number } | null
  recordsThisWeek: number
  weightChange: number | null
  goal: Goal | null
  cardio: { minutes: number; kcal: number } | null
}

export const statsService = {
  /** Ejercicios que hiciste, del más reciente al más viejo. */
  async exercisesDone(): Promise<ExerciseSummary[]> {
    const map = await setsByExercise()
    const exercises = await exercisesService.mapByIds([...map.keys()])
    const out: ExerciseSummary[] = []
    for (const [id, list] of map) {
      const exercise = exercises.get(id)
      const withSets = list.filter((l) => l.sets.length > 0)
      if (!exercise || withSets.length === 0) continue
      out.push({
        exercise,
        sessions: withSets.length,
        lastDate: toDateKey(new Date(withSets.at(-1)!.session.startedAt)),
        best: Math.max(...withSets.map((l) => bestSet(l.sets)?.e1rm ?? 0)),
      })
    }
    return out.sort((a, b) => b.lastDate.localeCompare(a.lastDate) || b.sessions - a.sessions)
  },

  /** Evolución de un ejercicio: mejor 1RM estimado, peso máximo y volumen por sesión. */
  async exerciseHistory(exerciseId: string): Promise<ExercisePoint[]> {
    const list = (await setsByExercise()).get(exerciseId) ?? []
    const type = (await exercisesService.getById(exerciseId))?.exerciseType ?? 'weighted'
    return list
      .filter((l) => l.sets.length > 0)
      .map((l) => ({
        date: toDateKey(new Date(l.session.startedAt)),
        e1rm: bestSet(l.sets)?.e1rm ?? 0,
        maxWeight: maxWeight(l.sets),
        volume: totalVolume(l.sets.map((s) => ({ set: s, type }))),
      }))
  },

  async weekly(
    today: string,
    weeks = 8,
  ): Promise<{ volume: WeekBucket[]; sessions: WeekBucket[]; cardioMinutes: WeekBucket[] }> {
    const history = await historyService.list()
    const cardio = await db.cardioLogs.toArray()
    const dated = (s: WorkoutSession, value: number): DatedValue => ({
      date: toDateKey(new Date(s.startedAt)),
      value,
    })
    return {
      volume: weeklySums(
        history.map((s) => dated(s, s.volume)),
        today,
        weeks,
      ),
      sessions: weeklySums(
        history.map((s) => dated(s, 1)),
        today,
        weeks,
      ),
      cardioMinutes: weeklySums(
        cardio.map((c) => ({ date: c.date, value: c.minutes })),
        today,
        weeks,
      ),
    }
  },

  async waterDaily(today: string, days = 14): Promise<DatedValue[]> {
    const logs = await db.waterLogs.toArray()
    return dailySums(
      logs.map((w) => ({ date: w.date, value: w.ml })),
      today,
      days,
    )
  },

  /** Datos para los mensajes de progreso (ventanas móviles de 7 días). */
  async insights(today: string): Promise<Insights> {
    const profile = await db.profile.get('me')
    const history = await historyService.list()
    const sessionDates = history.map((s) => toDateKey(new Date(s.startedAt)))
    const from7 = toDateKey(addDays(new Date(today + 'T12:00:00'), -6))
    const from14 = toDateKey(addDays(new Date(today + 'T12:00:00'), -13))
    const inRange = (d: string, a: string, b: string) => d >= a && d <= b

    const last7 = history.filter((s) => inRange(toDateKey(new Date(s.startedAt)), from7, today))
    const prev7 = history.filter((s) => {
      const d = toDateKey(new Date(s.startedAt))
      return d >= from14 && d < from7
    })
    const vol = (xs: typeof history) => xs.reduce((n, s) => n + s.volume, 0)

    // Récords en los últimos 7 días
    let records = 0
    for (const s of last7) records += (await historyService.summary(s.id))?.records.length ?? 0

    // Mayor mejora de fuerza (primer vs último 1RM estimado) entre ejercicios con 2+ sesiones
    let strength: Insights['strength'] = null
    const map = await setsByExercise()
    const exercises = await exercisesService.mapByIds([...map.keys()])
    for (const [id, list] of map) {
      const pts = list.map((l) => bestSet(l.sets)?.e1rm ?? 0).filter((v) => v > 0)
      if (pts.length < 2) continue
      const pct = pctChange(pts.at(-1)!, pts[0]!)
      if (pct !== null && pct > 0 && (!strength || pct > strength.pct))
        strength = {
          exerciseName: exercises.get(id)?.name ?? '',
          pct,
          from: pts[0]!,
          to: pts.at(-1)!,
        }
    }

    const weights = await bodyWeightService.list()
    const cardio = (await db.cardioLogs.toArray()).filter((c) => inRange(c.date, from7, today))

    // Semana actual (lunes a domingo) para la meta semanal
    const weekStart = weeklySums([], today, 1)[0]!.weekStart
    return {
      weekGoal: profile
        ? { done: sessionDates.filter((d) => d >= weekStart).length, goal: profile.daysPerWeek }
        : null,
      streak: profile ? weekStreak(sessionDates, today, profile.daysPerWeek) : 0,
      volumePct: prev7.length > 0 ? pctChange(vol(last7), vol(prev7)) : null,
      strength,
      recordsThisWeek: records,
      weightChange: weightStats(weights, today, null).weekChange,
      goal: profile?.goal ?? null,
      cardio: cardio.length
        ? {
            minutes: cardio.reduce((n, c) => n + c.minutes, 0),
            kcal: cardio.reduce((n, c) => n + c.kcal, 0),
          }
        : null,
    }
  },
}
