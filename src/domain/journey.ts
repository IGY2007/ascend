/**
 * El viaje: la subida al Olimpo. Un checkpoint cada 5 niveles (21 en total, del 1 al 100).
 * Alterna historia del gimnasio con lecciones de entrenamiento, nutrición, recuperación y
 * mentalidad: vas aprendiendo a medida que progresás. Es tu crecimiento personal (la liga, más
 * adelante, es la competencia contra otros). Los textos viven en i18n (journey.camps).
 */
export type CampKind = 'history' | 'training' | 'nutrition' | 'recovery' | 'mind' | 'myth'

export const CAMPS = [
  { id: 'base', level: 1, kind: 'history' },
  { id: 'gymnasion', level: 5, kind: 'history' },
  { id: 'technique', level: 10, kind: 'training' },
  { id: 'protein', level: 15, kind: 'nutrition' },
  { id: 'strongmen', level: 20, kind: 'history' },
  { id: 'progression', level: 25, kind: 'training' },
  { id: 'sleep', level: 30, kind: 'recovery' },
  { id: 'muscle_beach', level: 35, kind: 'history' },
  { id: 'volume', level: 40, kind: 'training' },
  { id: 'carbs', level: 45, kind: 'nutrition' },
  { id: 'golden_era', level: 50, kind: 'history' },
  { id: 'effort', level: 55, kind: 'training' },
  { id: 'creatine', level: 60, kind: 'nutrition' },
  { id: 'iron', level: 65, kind: 'history' },
  { id: 'deload', level: 70, kind: 'recovery' },
  { id: 'hydration', level: 75, kind: 'nutrition' },
  { id: 'women', level: 80, kind: 'history' },
  { id: 'mindset', level: 85, kind: 'mind' },
  { id: 'olympics', level: 90, kind: 'history' },
  { id: 'heracles', level: 95, kind: 'myth' },
  { id: 'olympus', level: 100, kind: 'myth' },
] as const satisfies readonly { id: string; level: number; kind: CampKind }[]

export type Camp = (typeof CAMPS)[number]
export type CampId = Camp['id']

export interface JourneyPosition {
  /** Índice del checkpoint actual (0 = campamento base). */
  index: number
  current: Camp
  next: Camp | null
  /** 0–1: cuánto del tramo entre el checkpoint actual y el siguiente ya recorriste. */
  progress: number
}

export function journeyPosition(level: number, intoLevel = 0, neededLevel = 1): JourneyPosition {
  let index = 0
  CAMPS.forEach((c, i) => {
    if (level >= c.level) index = i
  })
  const current = CAMPS[index]!
  const next = CAMPS[index + 1] ?? null
  if (!next) return { index, current, next, progress: 1 }
  const span = next.level - current.level
  const done = level - current.level + Math.min(1, intoLevel / Math.max(1, neededLevel))
  return { index, current, next, progress: Math.min(1, Math.max(0, done / span)) }
}
