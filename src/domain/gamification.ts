import { addDays, fromDateKey, startOfWeek, toDateKey } from './dates'
import type { MuscleGroup } from '@/types/models'

/**
 * Gamificación: XP, niveles, logros, desafíos semanales, niveles por músculo y resumen del mes.
 * Todo se calcula a partir de los datos reales (nada se guarda aparte), así nunca se desincroniza.
 */

// ---------------------------------------------------------------- hechos de entrada

export interface SessionFact {
  id: string
  date: string // AAAA-MM-DD local
  sets: number
  volume: number
  durationSeconds: number
}

export interface PrFact {
  date: string
  exerciseId: string
}

/** Series de trabajo de un ejercicio en una sesión (para músculos y el resumen). */
export interface ExerciseSetFact {
  date: string
  exerciseId: string
  muscle: MuscleGroup | null
  sets: number
  bestE1rm: number
  maxWeight: number
}

export interface Facts {
  sessions: SessionFact[]
  prs: PrFact[]
  exerciseSets: ExerciseSetFact[]
  cardio: { date: string; minutes: number }[]
  waterGoalDays: string[]
  weightLogs: string[]
  weekGoal: number
}

// ---------------------------------------------------------------- XP y niveles

export const XP = {
  set: 5,
  workout: 50,
  pr: 100,
  cardioSession: 30,
  waterGoal: 20,
  weighIn: 10,
  weekGoal: 150,
  challenge: 100,
} as const

/** XP que hace falta para pasar del nivel `level` al siguiente. */
export const xpToNext = (level: number) => 250 + 150 * (level - 1)

export interface LevelInfo {
  level: number
  xp: number
  /** XP dentro del nivel actual */
  into: number
  /** XP para el próximo nivel */
  needed: number
  title: LevelTitle
}

export const LEVEL_TITLES = [
  [1, 'rookie'],
  [3, 'regular'],
  [5, 'grinder'],
  [8, 'athlete'],
  [12, 'beast'],
  [17, 'titan'],
  [25, 'legend'],
] as const
export type LevelTitle = (typeof LEVEL_TITLES)[number][1]

export function levelFromXp(xp: number): LevelInfo {
  let level = 1
  let rest = Math.max(0, Math.floor(xp))
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level)
    level++
  }
  const title = [...LEVEL_TITLES].reverse().find(([min]) => level >= min)![1]
  return { level, xp: Math.floor(xp), into: rest, needed: xpToNext(level), title }
}

/** Semanas (lunes) en las que se cumplió la meta de días. */
export function weeksGoalMet(f: Facts): string[] {
  if (f.weekGoal <= 0) return []
  const days = new Map<string, Set<string>>()
  for (const s of f.sessions) {
    const w = toDateKey(startOfWeek(fromDateKey(s.date)))
    const set = days.get(w) ?? new Set<string>()
    set.add(s.date)
    days.set(w, set)
  }
  return [...days].filter(([, d]) => d.size >= f.weekGoal).map(([w]) => w)
}

/** Racha más larga de semanas seguidas cumpliendo la meta. */
export function bestWeekStreak(f: Facts): number {
  const weeks = new Set(weeksGoalMet(f))
  let best = 0
  for (const w of weeks) {
    if (weeks.has(toDateKey(addDays(fromDateKey(w), -7)))) continue // no es el inicio de una racha
    let len = 0
    let cur = fromDateKey(w)
    while (weeks.has(toDateKey(cur))) {
      len++
      cur = addDays(cur, 7)
    }
    best = Math.max(best, len)
  }
  return best
}

export interface XpBreakdown {
  total: number
  sets: number
  workouts: number
  prs: number
  cardio: number
  water: number
  weighIns: number
  weeks: number
  challenges: number
}

export function totalXp(f: Facts, completedChallenges: number): XpBreakdown {
  const b = {
    sets: f.sessions.reduce((n, s) => n + s.sets, 0) * XP.set,
    workouts: f.sessions.length * XP.workout,
    prs: f.prs.length * XP.pr,
    cardio: f.cardio.length * XP.cardioSession,
    water: f.waterGoalDays.length * XP.waterGoal,
    weighIns: f.weightLogs.length * XP.weighIn,
    weeks: weeksGoalMet(f).length * XP.weekGoal,
    challenges: completedChallenges * XP.challenge,
  }
  return { ...b, total: Object.values(b).reduce((a, v) => a + v, 0) }
}

/** XP que dio un entrenamiento (para el resumen al terminar). */
export function sessionXp(sets: number, prs: number): number {
  return XP.workout + sets * XP.set + prs * XP.pr
}

// ---------------------------------------------------------------- logros

export type AchievementIcon =
  'dumbbell' | 'trophy' | 'flame' | 'droplet' | 'zap' | 'weight' | 'scale' | 'layers' | 'calendar'

export interface Totals {
  workouts: number
  sets: number
  volume: number
  prs: number
  bestStreak: number
  weeksGoalMet: number
  cardioSessions: number
  waterGoalDays: number
  weightLogs: number
  maxLift: number
}

export interface AchievementDef {
  id: string
  icon: AchievementIcon
  target: number
  value: (t: Totals) => number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_workout', icon: 'dumbbell', target: 1, value: (t) => t.workouts },
  { id: 'workouts_10', icon: 'dumbbell', target: 10, value: (t) => t.workouts },
  { id: 'workouts_50', icon: 'dumbbell', target: 50, value: (t) => t.workouts },
  { id: 'workouts_100', icon: 'dumbbell', target: 100, value: (t) => t.workouts },
  { id: 'first_pr', icon: 'trophy', target: 1, value: (t) => t.prs },
  { id: 'prs_10', icon: 'trophy', target: 10, value: (t) => t.prs },
  { id: 'prs_50', icon: 'trophy', target: 50, value: (t) => t.prs },
  { id: 'full_week', icon: 'calendar', target: 1, value: (t) => t.weeksGoalMet },
  { id: 'streak_4', icon: 'flame', target: 4, value: (t) => t.bestStreak },
  { id: 'streak_12', icon: 'flame', target: 12, value: (t) => t.bestStreak },
  { id: 'sets_500', icon: 'layers', target: 500, value: (t) => t.sets },
  { id: 'volume_10t', icon: 'weight', target: 10_000, value: (t) => t.volume },
  { id: 'volume_100t', icon: 'weight', target: 100_000, value: (t) => t.volume },
  { id: 'volume_1000t', icon: 'weight', target: 1_000_000, value: (t) => t.volume },
  { id: 'club_100', icon: 'trophy', target: 100, value: (t) => t.maxLift },
  { id: 'hydrated_7', icon: 'droplet', target: 7, value: (t) => t.waterGoalDays },
  { id: 'hydrated_30', icon: 'droplet', target: 30, value: (t) => t.waterGoalDays },
  { id: 'cardio_10', icon: 'zap', target: 10, value: (t) => t.cardioSessions },
  { id: 'weigh_in_10', icon: 'scale', target: 10, value: (t) => t.weightLogs },
]

export interface AchievementState {
  def: AchievementDef
  value: number
  unlocked: boolean
  /** 0–1 */
  progress: number
}

export function totalsOf(f: Facts): Totals {
  return {
    workouts: f.sessions.length,
    sets: f.sessions.reduce((n, s) => n + s.sets, 0),
    volume: f.sessions.reduce((n, s) => n + s.volume, 0),
    prs: f.prs.length,
    bestStreak: bestWeekStreak(f),
    weeksGoalMet: weeksGoalMet(f).length,
    cardioSessions: f.cardio.length,
    waterGoalDays: f.waterGoalDays.length,
    weightLogs: f.weightLogs.length,
    maxLift: f.exerciseSets.reduce((m, e) => Math.max(m, e.maxWeight), 0),
  }
}

export function achievements(totals: Totals): AchievementState[] {
  return ACHIEVEMENTS.map((def) => {
    const value = def.value(totals)
    return { def, value, unlocked: value >= def.target, progress: Math.min(1, value / def.target) }
  })
}

// ---------------------------------------------------------------- desafíos semanales

export type ChallengeKind =
  'train_days' | 'water_days' | 'cardio_minutes' | 'record' | 'sets' | 'weigh_ins' | 'beat_volume'

export interface Challenge {
  kind: ChallengeKind
  target: number
  value: number
  done: boolean
}

const OPTIONAL: ChallengeKind[] = [
  'water_days',
  'cardio_minutes',
  'record',
  'sets',
  'weigh_ins',
  'beat_volume',
]

/** Número de semana estable (para rotar los desafíos de forma determinística). */
const weekIndex = (weekStart: string) => Math.round(fromDateKey(weekStart).getTime() / 604_800_000)

/** Los 3 desafíos de la semana que empieza en `weekStart` (lunes), con su avance. */
export function weeklyChallenges(f: Facts, weekStart: string): Challenge[] {
  const end = toDateKey(addDays(fromDateKey(weekStart), 6))
  const prevStart = toDateKey(addDays(fromDateKey(weekStart), -7))
  const inWeek = (d: string) => d >= weekStart && d <= end
  const inPrev = (d: string) => d >= prevStart && d < weekStart
  const sessions = f.sessions.filter((s) => inWeek(s.date))
  const prevVolume = f.sessions.filter((s) => inPrev(s.date)).reduce((n, s) => n + s.volume, 0)
  const goal = Math.max(1, f.weekGoal)

  const make = (kind: ChallengeKind): Challenge | null => {
    let target: number
    let value: number
    switch (kind) {
      case 'train_days':
        target = goal
        value = new Set(sessions.map((s) => s.date)).size
        break
      case 'water_days':
        target = 5
        value = f.waterGoalDays.filter(inWeek).length
        break
      case 'cardio_minutes':
        target = 60
        value = f.cardio.filter((c) => inWeek(c.date)).reduce((n, c) => n + c.minutes, 0)
        break
      case 'record':
        target = 1
        value = f.prs.filter((p) => inWeek(p.date)).length
        break
      case 'sets':
        target = goal * 15
        value = sessions.reduce((n, s) => n + s.sets, 0)
        break
      case 'weigh_ins':
        target = 3
        value = f.weightLogs.filter(inWeek).length
        break
      case 'beat_volume':
        if (prevVolume <= 0) return null
        target = Math.round(prevVolume) + 1
        value = Math.round(sessions.reduce((n, s) => n + s.volume, 0))
        break
    }
    return { kind, target, value, done: value >= target }
  }

  const out = [make('train_days')!]
  const idx = weekIndex(weekStart)
  for (let i = 0; out.length < 3 && i < OPTIONAL.length; i++) {
    const c = make(OPTIONAL[(idx * 2 + i) % OPTIONAL.length]!)
    if (c) out.push(c)
  }
  return out
}

/** Desafíos cumplidos desde la primera actividad hasta la semana de `today` (para el XP). */
export function completedChallenges(f: Facts, today: string): number {
  const dates = [
    ...f.sessions.map((s) => s.date),
    ...f.cardio.map((c) => c.date),
    ...f.waterGoalDays,
    ...f.weightLogs,
  ].sort()
  if (dates.length === 0) return 0
  let week = startOfWeek(fromDateKey(dates[0]!))
  const last = startOfWeek(fromDateKey(today))
  let n = 0
  while (week <= last) {
    n += weeklyChallenges(f, toDateKey(week)).filter((c) => c.done).length
    week = addDays(week, 7)
  }
  return n
}

// ---------------------------------------------------------------- niveles por músculo

export type Stat = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'calves' | 'core'
export const STATS: Stat[] = ['chest', 'back', 'shoulders', 'arms', 'legs', 'calves', 'core']

const STAT_OF: Partial<Record<MuscleGroup, Stat>> = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'calves',
  abs: 'core',
}

/** Grupo de la ficha al que pertenece un músculo (null si no suma a ninguno). */
export const statOf = (m: MuscleGroup): Stat | null => STAT_OF[m] ?? null

export type Readiness = 'recovering' | 'ready' | 'cold' | 'untrained'

export interface MuscleStat {
  stat: Stat
  sets: number
  level: number
  /** 0–1 hacia el próximo nivel */
  progress: number
  lastDate: string | null
  readiness: Readiness
  /** Series en los últimos 7 días */
  weekSets: number
}

/** Nivel n requiere 4·(n−1)² series acumuladas: 4, 16, 36, 64… */
export const setsForMuscleLevel = (level: number) => 4 * (level - 1) ** 2

export function muscleStats(f: Facts, today: string): MuscleStat[] {
  const weekAgo = toDateKey(addDays(fromDateKey(today), -6))
  return STATS.map((stat) => {
    const facts = f.exerciseSets.filter((e) => e.muscle && STAT_OF[e.muscle] === stat)
    const sets = facts.reduce((n, e) => n + e.sets, 0)
    let level = 1
    while (sets >= setsForMuscleLevel(level + 1)) level++
    const from = setsForMuscleLevel(level)
    const to = setsForMuscleLevel(level + 1)
    const lastDate =
      facts
        .map((e) => e.date)
        .sort()
        .at(-1) ?? null
    const days = lastDate
      ? Math.round((fromDateKey(today).getTime() - fromDateKey(lastDate).getTime()) / 86_400_000)
      : null
    const readiness: Readiness =
      days === null ? 'untrained' : days < 2 ? 'recovering' : days <= 7 ? 'ready' : 'cold'
    return {
      stat,
      sets,
      level,
      progress: (sets - from) / (to - from),
      lastDate,
      readiness,
      weekSets: facts.filter((e) => e.date >= weekAgo).reduce((n, e) => n + e.sets, 0),
    }
  })
}

/** Nivel general del físico: promedio de los niveles de cada grupo. */
export function physiqueLevel(stats: MuscleStat[]): number {
  return Math.round((stats.reduce((n, s) => n + s.level, 0) / stats.length) * 10) / 10
}

/** El grupo más atrasado respecto del más fuerte (si la diferencia vale la pena). */
export function laggingStat(stats: MuscleStat[]): MuscleStat | null {
  const trained = stats.filter((s) => s.sets > 0)
  if (trained.length === 0) return null
  const max = Math.max(...stats.map((s) => s.sets))
  const min = [...stats].sort((a, b) => a.sets - b.sets)[0]!
  return max >= 12 && min.sets < max * 0.4 ? min : null
}

// ---------------------------------------------------------------- resumen del mes

export interface MonthRecap {
  workouts: number
  sets: number
  volume: number
  minutes: number
  prs: number
  cardioMinutes: number
  waterGoalDays: number
  topExerciseId: string | null
  bestLift: { exerciseId: string; e1rm: number } | null
}

export function monthRecap(f: Facts, year: number, month: number): MonthRecap {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const inMonth = (d: string) => d.startsWith(prefix)
  const sessions = f.sessions.filter((s) => inMonth(s.date))
  const ex = f.exerciseSets.filter((e) => inMonth(e.date))
  const setsBy = new Map<string, number>()
  let bestLift: MonthRecap['bestLift'] = null
  for (const e of ex) {
    setsBy.set(e.exerciseId, (setsBy.get(e.exerciseId) ?? 0) + e.sets)
    if (!bestLift || e.bestE1rm > bestLift.e1rm)
      bestLift = { exerciseId: e.exerciseId, e1rm: e.bestE1rm }
  }
  const top = [...setsBy].sort((a, b) => b[1] - a[1])[0]
  return {
    workouts: sessions.length,
    sets: sessions.reduce((n, s) => n + s.sets, 0),
    volume: sessions.reduce((n, s) => n + s.volume, 0),
    minutes: Math.round(sessions.reduce((n, s) => n + s.durationSeconds, 0) / 60),
    prs: f.prs.filter((p) => inMonth(p.date)).length,
    cardioMinutes: f.cardio.filter((c) => inMonth(c.date)).reduce((n, c) => n + c.minutes, 0),
    waterGoalDays: f.waterGoalDays.filter(inMonth).length,
    topExerciseId: top?.[0] ?? null,
    bestLift: bestLift && bestLift.e1rm > 0 ? bestLift : null,
  }
}

/** Comparación divertida del volumen: "como levantar 3 elefantes". */
export function volumeEquivalent(
  kg: number,
): { thing: 'whale' | 'elephant' | 'car' | 'piano'; count: number } | null {
  const things = [
    ['whale', 150_000],
    ['elephant', 6_000],
    ['car', 1_500],
    ['piano', 300],
  ] as const
  for (const [thing, w] of things) {
    if (kg >= w) return { thing, count: Math.round((kg / w) * 10) / 10 }
  }
  return null
}
