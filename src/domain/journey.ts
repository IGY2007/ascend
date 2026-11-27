/**
 * El viaje: una montaña con campamentos que se desbloquean al subir de nivel, hasta el Olimpo.
 * Es tu crecimiento personal (la liga, más adelante, es la competencia contra otros).
 * Cada campamento trae una historia corta de la cultura del gimnasio (textos en i18n).
 */
export const CAMPS = [
  { id: 'base', level: 1 },
  { id: 'gymnasion', level: 3 },
  { id: 'strongmen', level: 5 },
  { id: 'muscle_beach', level: 8 },
  { id: 'golden_era', level: 12 },
  { id: 'iron', level: 17 },
  { id: 'olympus', level: 25 },
] as const

export type CampId = (typeof CAMPS)[number]['id']

export interface JourneyPosition {
  /** Índice del campamento actual (0 = base). */
  index: number
  current: (typeof CAMPS)[number]
  next: (typeof CAMPS)[number] | null
  /** 0–1: cuánto falta del tramo entre el campamento actual y el siguiente. */
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
