import { db } from '@/lib/db'
import { toDateKey } from '@/domain/dates'
import { bestSet, isWorkingSet, maxWeight, setVolume } from '@/domain/workout'
import { waterTargetMl } from '@/domain/cardio'
import {
  achievements,
  completedChallenges,
  levelFromXp,
  muscleStats,
  totalXp,
  totalsOf,
  weeklyChallenges,
  type ExerciseSetFact,
  type Facts,
  type PrFact,
  type SessionFact,
} from '@/domain/gamification'
import { startOfWeek } from '@/domain/dates'
import { exercisesService } from './local-data'
import { bodyFromSets, monthSets, type Body } from '@/domain/avatar'

/**
 * Junta los datos reales del dispositivo en un solo objeto (`Facts`) para la gamificación.
 * Son pocas filas por usuario: se lee todo de una vez.
 */
export async function loadFacts(): Promise<Facts> {
  const [sessions, ses, sets, cardio, water, weights, profile] = await Promise.all([
    db.sessions.where('status').equals('completed').toArray(),
    db.sessionExercises.toArray(),
    db.exerciseSets.toArray(),
    db.cardioLogs.toArray(),
    db.waterLogs.toArray(),
    db.bodyWeights.toArray(),
    db.profile.get('me'),
  ])
  sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  const exercises = await exercisesService.mapByIds([
    ...new Set(ses.map((s) => s.exerciseId).filter((x): x is string => !!x)),
  ])
  const setsBySe = new Map<string, typeof sets>()
  for (const s of sets) {
    if (!isWorkingSet(s)) continue
    const list = setsBySe.get(s.sessionExerciseId) ?? []
    list.push(s)
    setsBySe.set(s.sessionExerciseId, list)
  }
  const sesBySession = new Map<string, typeof ses>()
  for (const se of ses) {
    const list = sesBySession.get(se.sessionId) ?? []
    list.push(se)
    sesBySession.set(se.sessionId, list)
  }

  const sessionFacts: SessionFact[] = []
  const exerciseSets: ExerciseSetFact[] = []
  const prs: PrFact[] = []
  const best = new Map<string, { w: number; e: number }>()

  for (const s of sessions) {
    const date = toDateKey(new Date(s.startedAt))
    let count = 0
    let volume = 0
    for (const se of sesBySession.get(s.id) ?? []) {
      const list = setsBySe.get(se.id) ?? []
      if (list.length === 0 || !se.exerciseId) continue
      const ex = exercises.get(se.exerciseId)
      const type = ex?.exerciseType ?? 'weighted'
      count += list.length
      volume += list.reduce((n, x) => n + setVolume(x, type), 0)
      const w = type === 'weighted' ? maxWeight(list) : 0
      const e = type === 'weighted' ? (bestSet(list)?.e1rm ?? 0) : 0
      exerciseSets.push({
        date,
        exerciseId: se.exerciseId,
        muscle: ex?.primaryMuscle ?? null,
        sets: list.length,
        bestE1rm: e,
        maxWeight: w,
      })
      // Récord: supera lo mejor de las sesiones anteriores (la primera vez no cuenta)
      const prev = best.get(se.exerciseId)
      if (prev && (w > prev.w || e > prev.e)) prs.push({ date, exerciseId: se.exerciseId })
      best.set(se.exerciseId, { w: Math.max(prev?.w ?? 0, w), e: Math.max(prev?.e ?? 0, e) })
    }
    if (count > 0)
      sessionFacts.push({
        id: s.id,
        date,
        sets: count,
        volume,
        durationSeconds: s.durationSeconds ?? 0,
      })
  }

  // Agua: días que llegaron al objetivo (con el peso más reciente)
  const latestWeight =
    weights.sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.weightKg ?? profile?.weightKg ?? 70
  const target = waterTargetMl(latestWeight)
  const waterByDay = new Map<string, number>()
  for (const w of water) waterByDay.set(w.date, (waterByDay.get(w.date) ?? 0) + w.ml)

  return {
    sessions: sessionFacts,
    prs,
    exerciseSets,
    cardio: cardio.map((c) => ({ date: c.date, minutes: c.minutes })),
    waterGoalDays: [...waterByDay].filter(([, ml]) => ml >= target).map(([d]) => d),
    weightLogs: weights.map((w) => w.date),
    weekGoal: profile?.daysPerWeek ?? 3,
  }
}

export interface GameState {
  facts: Facts
  level: ReturnType<typeof levelFromXp>
  achievements: ReturnType<typeof achievements>
  challenges: ReturnType<typeof weeklyChallenges>
  muscles: ReturnType<typeof muscleStats>
  /** Series de cada grupo en el mes actual y cuánto creció el personaje (0–1). */
  monthSets: Body
  monthBody: Body
}

export async function gameState(today = toDateKey(new Date())): Promise<GameState> {
  const facts = await loadFacts()
  const xp = totalXp(facts, completedChallenges(facts, today))
  const now = new Date()
  const sets = monthSets(facts, now.getFullYear(), now.getMonth())
  return {
    facts,
    level: levelFromXp(xp.total),
    achievements: achievements(totalsOf(facts)),
    challenges: weeklyChallenges(facts, toDateKey(startOfWeek(new Date()))),
    muscles: muscleStats(facts, today),
    monthSets: sets,
    monthBody: bodyFromSets(sets),
  }
}

// ---------------------------------------------------------------- logros ya vistos

const SEEN_KEY = 'ascend-achievements-seen'

export function seenAchievements(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function markAchievementsSeen(ids: string[]) {
  const seen = seenAchievements()
  ids.forEach((id) => seen.add(id))
  localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
}
