import type { ExerciseType, SetType } from '@/types/models'

/** Datos mínimos de una serie para los cálculos. */
export interface SetLike {
  weightKg: number | null
  repetitions: number | null
  isCompleted: boolean
  setType: SetType
}

/** Cuenta para volumen y récords: completada, no de calentamiento, con reps. */
export function isWorkingSet(s: SetLike): boolean {
  return s.isCompleted && s.setType === 'normal' && (s.repetitions ?? 0) > 0
}

/** Volumen = peso × reps, solo series completadas de ejercicios con carga. */
export function setVolume(s: SetLike, type: ExerciseType): number {
  if (type !== 'weighted' || !isWorkingSet(s)) return 0
  return (s.weightKg ?? 0) * (s.repetitions ?? 0)
}

export function totalVolume(items: { set: SetLike; type: ExerciseType }[]): number {
  return Math.round(items.reduce((sum, { set, type }) => sum + setVolume(set, type), 0))
}

/** 1RM estimado con Epley: peso × (1 + reps/30). Es una estimación. */
export function e1rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0
  if (reps === 1) return weightKg
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}

export interface BestSet {
  weightKg: number
  repetitions: number
  e1rm: number
}

/** Mejor serie por 1RM estimado. */
export function bestSet(sets: SetLike[]): BestSet | null {
  let best: BestSet | null = null
  for (const s of sets) {
    if (!isWorkingSet(s) || !s.weightKg) continue
    const value = e1rm(s.weightKg, s.repetitions!)
    if (!best || value > best.e1rm)
      best = { weightKg: s.weightKg, repetitions: s.repetitions!, e1rm: value }
  }
  return best
}

export function maxWeight(sets: SetLike[]): number {
  return Math.max(0, ...sets.filter(isWorkingSet).map((s) => s.weightKg ?? 0))
}

export type RecordKind = 'weight' | 'e1rm'

export interface PersonalRecord {
  exerciseId: string
  kind: RecordKind
  value: number
  previous: number
}

/**
 * Récords nuevos de una sesión frente al historial previo de cada ejercicio.
 * Solo cuenta si había historial (la primera vez no es "récord", es la base).
 */
export function detectRecords(
  current: Map<string, SetLike[]>,
  history: Map<string, SetLike[]>,
): PersonalRecord[] {
  const records: PersonalRecord[] = []
  for (const [exerciseId, sets] of current) {
    const past = history.get(exerciseId) ?? []
    if (!past.some(isWorkingSet)) continue
    const prevMax = maxWeight(past)
    const nowMax = maxWeight(sets)
    if (nowMax > prevMax)
      records.push({ exerciseId, kind: 'weight', value: nowMax, previous: prevMax })
    const prevBest = bestSet(past)?.e1rm ?? 0
    const nowBest = bestSet(sets)?.e1rm ?? 0
    if (nowBest > prevBest && nowMax <= prevMax)
      records.push({ exerciseId, kind: 'e1rm', value: nowBest, previous: prevBest })
  }
  return records
}

export interface SessionComparison {
  volumeDiff: number
  volumePct: number | null
  setsDiff: number
  durationDiff: number | null
}

export function compareSessions(
  current: { volume: number; sets: number; durationSeconds: number | null },
  previous: { volume: number; sets: number; durationSeconds: number | null } | null,
): SessionComparison | null {
  if (!previous) return null
  return {
    volumeDiff: current.volume - previous.volume,
    volumePct:
      previous.volume > 0
        ? Math.round(((current.volume - previous.volume) / previous.volume) * 1000) / 10
        : null,
    setsDiff: current.sets - previous.sets,
    durationDiff:
      current.durationSeconds !== null && previous.durationSeconds !== null
        ? current.durationSeconds - previous.durationSeconds
        : null,
  }
}

/** Siguiente rutina de la rotación: la que sigue a la última completada (o la primera). */
export function nextInRotation<T extends { id: string }>(
  templates: T[],
  lastCompletedTemplateId: string | null,
): T | null {
  if (templates.length === 0) return null
  const i = templates.findIndex((t) => t.id === lastCompletedTemplateId)
  return templates[(i + 1) % templates.length] ?? null
}

/** Segundos → "52:07" o "1:05:12". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

/** Segundos que faltan del descanso (calculado desde la hora de fin: robusto a iOS). */
export function restRemaining(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

/**
 * Sugerencia de progresión (doble progresión): si en la última vez completaste el tope del rango
 * en todas las series de trabajo, subí el peso.
 */
export function suggestIncrease(
  lastSets: SetLike[],
  repsMax: number | null,
  stepKg = 2.5,
): number | null {
  const working = lastSets.filter(isWorkingSet)
  if (!repsMax || working.length === 0) return null
  if (!working.every((s) => (s.repetitions ?? 0) >= repsMax)) return null
  const top = maxWeight(working)
  return top > 0 ? top + stepKg : null
}
