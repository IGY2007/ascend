import { statOf, type ExerciseSetFact, type Stat } from './gamification'

export interface IndexPoint {
  date: string
  /** 100 = tu punto de partida. 110 = 10 % más fuerte en promedio. */
  value: number
}

/**
 * Índice de fuerza: compara el mejor 1RM estimado de cada ejercicio con el de la primera vez
 * que lo hiciste, y promedia todos los ejercicios (usando el último valor conocido de cada uno).
 * Así se pueden juntar ejercicios con pesos muy distintos en una sola línea.
 * Con `group`, solo cuenta los ejercicios de ese grupo muscular.
 */
export function strengthIndex(sets: ExerciseSetFact[], group?: Stat): IndexPoint[] {
  const relevant = sets
    .filter((s) => s.bestE1rm > 0)
    .filter((s) => !group || (s.muscle !== null && statOf(s.muscle) === group))
    .sort((a, b) => a.date.localeCompare(b.date))
  const first = new Map<string, number>()
  const latest = new Map<string, number>()
  const points: IndexPoint[] = []
  for (const s of relevant) {
    const base = first.get(s.exerciseId)
    if (base === undefined) first.set(s.exerciseId, s.bestE1rm)
    // Si hay dos registros del mismo ejercicio el mismo día, gana el mejor
    const ratio = s.bestE1rm / (base ?? s.bestE1rm)
    const prev = points.at(-1)?.date === s.date ? latest.get(s.exerciseId) : undefined
    latest.set(s.exerciseId, Math.max(ratio, prev ?? 0))
    const values = [...latest.values()]
    const value = (values.reduce((n, v) => n + v, 0) / values.length) * 100
    if (points.at(-1)?.date === s.date) points.at(-1)!.value = value
    else points.push({ date: s.date, value })
  }
  return points
}
