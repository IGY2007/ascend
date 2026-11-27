import type { Facts, Stat } from './gamification'
import { STATS, statOf } from './gamification'
import type { Sex } from '@/types/models'

/**
 * El personaje del usuario: se arma con detalles chicos y su cuerpo crece según lo que entrenó
 * cada grupo muscular EN EL MES (el 1° de cada mes vuelve a empezar).
 * Algunas opciones se desbloquean por nivel o por logros; otras son exclusivas de Pro (futuro).
 */

export const SKINS = [
  '#fbe0cc',
  '#f6d3b8',
  '#e9b48f',
  '#d9a074',
  '#c98e66',
  '#a0673f',
  '#704629',
  '#4a2e1c',
] as const
export const HAIR_COLORS = [
  '#1f1a17',
  '#4b2e1e',
  '#8a5a2b',
  '#d9b26b',
  '#ece6d6',
  '#b5472e',
  '#a1a1aa',
  '#8b5cf6',
  '#f472b6',
  '#3b82f6',
] as const
export const SHIRT_COLORS = [
  '#8b5cf6',
  '#a3e635',
  '#f4f4f5',
  '#3f3f46',
  '#ef4444',
  '#3b82f6',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#d4a72c',
] as const
export const SHORTS_COLORS = [
  '#34313f',
  '#18181b',
  '#1e3a8a',
  '#7f1d1d',
  '#e4e4e7',
  '#4d7c0f',
] as const
export const SHOES_COLORS = [
  '#f4f4f5',
  '#27272a',
  '#8b5cf6',
  '#ef4444',
  '#a3e635',
  '#e6b422',
] as const

export const BODIES = ['male', 'female'] as const
export const HAIR_STYLES = [
  'short',
  'sidepart',
  'buzz',
  'curly',
  'long',
  'ponytail',
  'bun',
  'braids',
  'afro',
  'mohawk',
  'spiky',
  'bald',
] as const
export const EYES = ['normal', 'happy', 'lashes', 'focused'] as const
export const FACIAL = ['none', 'stubble', 'beard', 'goatee', 'mustache'] as const
export const OUTFITS = ['tank', 'tee', 'shirtless', 'sportsbra', 'hoodie', 'jersey'] as const
export const HEADWEAR = ['none', 'headband', 'cap', 'beanie', 'headphones', 'crown'] as const
export const EYEWEAR = ['none', 'glasses', 'sunglasses'] as const
export const EXTRAS = ['none', 'wristbands', 'medal', 'chain', 'cape', 'aura'] as const

export type BodyType = (typeof BODIES)[number]
export type HairStyle = (typeof HAIR_STYLES)[number]
export type Eyes = (typeof EYES)[number]
export type Facial = (typeof FACIAL)[number]
export type Outfit = (typeof OUTFITS)[number]
export type Headwear = (typeof HEADWEAR)[number]
export type Eyewear = (typeof EYEWEAR)[number]
export type Extra = (typeof EXTRAS)[number]

export interface AvatarConfig {
  body: BodyType
  skin: number
  hair: HairStyle
  hairColor: number
  eyes: Eyes
  facial: Facial
  outfit: Outfit
  shirtColor: number
  shortsColor: number
  shoesColor: number
  headwear: Headwear
  eyewear: Eyewear
  extra: Extra
}

/** Ropa que tiene sentido para cada cuerpo. */
export const OUTFITS_BY_BODY: Record<BodyType, readonly Outfit[]> = {
  male: ['tank', 'tee', 'shirtless', 'hoodie', 'jersey'],
  female: ['tank', 'tee', 'sportsbra', 'hoodie', 'jersey'],
}

export function defaultAvatar(sex?: Sex): AvatarConfig {
  const female = sex === 'female'
  return {
    body: female ? 'female' : 'male',
    skin: 2,
    hair: female ? 'ponytail' : 'short',
    hairColor: 1,
    eyes: female ? 'lashes' : 'normal',
    facial: 'none',
    outfit: 'tank',
    shirtColor: 0,
    shortsColor: 0,
    shoesColor: 0,
    headwear: 'none',
    eyewear: 'none',
    extra: 'none',
  }
}

// ---------------------------------------------------------------- desbloqueos

export type Unlock =
  | { kind: 'free' }
  | { kind: 'level'; level: number }
  | { kind: 'achievement'; id: string }
  | { kind: 'pro' }

/** Lo que no figura acá es gratis desde el principio. Claves: "campo:valor". */
const UNLOCKS: Record<string, Unlock> = {
  'hair:mohawk': { kind: 'level', level: 3 },
  'hair:afro': { kind: 'level', level: 5 },
  'hair:braids': { kind: 'level', level: 5 },
  'hair:spiky': { kind: 'level', level: 8 },
  'hairColor:7': { kind: 'level', level: 3 },
  'hairColor:8': { kind: 'level', level: 3 },
  'hairColor:9': { kind: 'level', level: 5 },
  'eyes:focused': { kind: 'level', level: 3 },
  'facial:goatee': { kind: 'level', level: 3 },
  'outfit:hoodie': { kind: 'level', level: 3 },
  'outfit:jersey': { kind: 'achievement', id: 'full_week' },
  'shirtColor:7': { kind: 'level', level: 3 },
  'shirtColor:8': { kind: 'level', level: 3 },
  'shirtColor:9': { kind: 'pro' },
  'shoesColor:3': { kind: 'level', level: 3 },
  'shoesColor:4': { kind: 'achievement', id: 'first_pr' },
  'shoesColor:5': { kind: 'pro' },
  'headwear:cap': { kind: 'level', level: 3 },
  'headwear:beanie': { kind: 'level', level: 3 },
  'headwear:headphones': { kind: 'achievement', id: 'streak_4' },
  'headwear:crown': { kind: 'pro' },
  'eyewear:sunglasses': { kind: 'level', level: 5 },
  'extra:wristbands': { kind: 'level', level: 3 },
  'extra:medal': { kind: 'achievement', id: 'workouts_10' },
  'extra:chain': { kind: 'achievement', id: 'club_100' },
  'extra:cape': { kind: 'pro' },
  'extra:aura': { kind: 'pro' },
}

/** Lo que se desbloquea exactamente al llegar a un nivel (para mostrarlo en el viaje). */
export function unlocksAtLevel(level: number): { field: keyof AvatarConfig; value: string }[] {
  return Object.entries(UNLOCKS)
    .filter(([, u]) => u.kind === 'level' && u.level === level)
    .map(([k]) => {
      const [field, value] = k.split(':') as [keyof AvatarConfig, string]
      return { field, value }
    })
}

export function unlockOf(field: keyof AvatarConfig, value: string | number): Unlock {
  return UNLOCKS[`${field}:${value}`] ?? { kind: 'free' }
}

export interface Progress {
  level: number
  achievements: ReadonlySet<string>
  /** Plan Pro (todavía no existe: siempre false). */
  pro: boolean
}

export function isUnlocked(u: Unlock, p: Progress): boolean {
  switch (u.kind) {
    case 'free':
      return true
    case 'level':
      return p.level >= u.level
    case 'achievement':
      return p.achievements.has(u.id)
    case 'pro':
      return p.pro
  }
}

/** Personaje al azar con lo que ya tenés desbloqueado. */
export function randomAvatar(progress: Progress, random: () => number = Math.random): AvatarConfig {
  const pickFrom = <T extends string | number>(field: keyof AvatarConfig, list: readonly T[]) => {
    const ok = list.filter((v) => isUnlocked(unlockOf(field, v), progress))
    return ok[Math.floor(random() * ok.length)] ?? list[0]!
  }
  const idx = (n: number) => Array.from({ length: n }, (_, i) => i)
  const body = pickFrom('body', BODIES) as BodyType
  return {
    body,
    skin: pickFrom('skin', idx(SKINS.length)),
    hair: pickFrom('hair', HAIR_STYLES),
    hairColor: pickFrom('hairColor', idx(HAIR_COLORS.length)),
    eyes: pickFrom('eyes', EYES),
    facial: body === 'female' ? 'none' : pickFrom('facial', FACIAL),
    outfit: pickFrom('outfit', OUTFITS_BY_BODY[body]),
    shirtColor: pickFrom('shirtColor', idx(SHIRT_COLORS.length)),
    shortsColor: pickFrom('shortsColor', idx(SHORTS_COLORS.length)),
    shoesColor: pickFrom('shoesColor', idx(SHOES_COLORS.length)),
    headwear: random() < 0.5 ? 'none' : pickFrom('headwear', HEADWEAR),
    eyewear: random() < 0.7 ? 'none' : pickFrom('eyewear', EYEWEAR),
    extra: random() < 0.6 ? 'none' : pickFrom('extra', EXTRAS),
  }
}

/** Normaliza lo guardado: completa campos nuevos y migra el formato viejo (un solo accesorio). */
export function sanitizeAvatar(
  raw: (Partial<AvatarConfig> & { accessory?: string }) | undefined,
  sex?: Sex,
): AvatarConfig {
  const d = defaultAvatar(sex)
  if (!raw) return d
  const a = { ...raw }
  if (a.accessory) {
    if (a.accessory === 'headband' || a.accessory === 'cap') a.headwear ??= a.accessory
    if (a.accessory === 'glasses') a.eyewear ??= 'glasses'
    if (a.accessory === 'chain') a.extra ??= 'chain'
  }
  const inList = <T>(list: readonly T[], v: unknown, fallback: T): T =>
    list.includes(v as T) ? (v as T) : fallback
  const inRange = (v: unknown, n: number, fallback: number) =>
    typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < n ? v : fallback
  const body = inList(BODIES, a.body, d.body)
  let outfit = inList(OUTFITS, a.outfit, d.outfit)
  if (!OUTFITS_BY_BODY[body].includes(outfit))
    outfit = body === 'female' ? 'sportsbra' : 'shirtless'
  return {
    body,
    skin: inRange(a.skin, SKINS.length, d.skin),
    hair: inList(HAIR_STYLES, a.hair, d.hair),
    hairColor: inRange(a.hairColor, HAIR_COLORS.length, d.hairColor),
    eyes: inList(EYES, a.eyes, d.eyes),
    facial: inList(FACIAL, a.facial, d.facial),
    outfit,
    shirtColor: inRange(a.shirtColor, SHIRT_COLORS.length, d.shirtColor),
    shortsColor: inRange(a.shortsColor, SHORTS_COLORS.length, d.shortsColor),
    shoesColor: inRange(a.shoesColor, SHOES_COLORS.length, d.shoesColor),
    headwear: inList(HEADWEAR, a.headwear, d.headwear),
    eyewear: inList(EYEWEAR, a.eyewear, d.eyewear),
    extra: inList(EXTRAS, a.extra, d.extra),
  }
}

// ---------------------------------------------------------------- crecimiento mensual

export type Body = Record<Stat, number>

/** Series en el mes para llegar al máximo de cada grupo (~12 por semana: zona de crecimiento). */
export const MONTH_MAX_SETS: Record<Stat, number> = {
  chest: 48,
  back: 48,
  shoulders: 40,
  arms: 48,
  legs: 48,
  calves: 32,
  core: 32,
}

export const EMPTY_BODY: Body = Object.fromEntries(STATS.map((s) => [s, 0])) as Body
export const FULL_BODY: Body = Object.fromEntries(STATS.map((s) => [s, 1])) as Body

/** Series de cada grupo en el mes (año, mes 0–11). */
export function monthSets(f: Facts, year: number, month: number): Body {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const out = { ...EMPTY_BODY }
  for (const e of f.exerciseSets) {
    if (!e.date.startsWith(prefix) || !e.muscle) continue
    const stat = statOf(e.muscle)
    if (stat) out[stat] += e.sets
  }
  return out
}

/** Cuánto creció cada grupo este mes: 0 (recién empieza) a 1 (máximo). Curva suave. */
export function bodyFromSets(sets: Body): Body {
  const out = { ...EMPTY_BODY }
  for (const s of STATS) out[s] = Math.min(1, Math.sqrt(sets[s] / MONTH_MAX_SETS[s]))
  return out
}

/** El grupo más chico y el más grande (para el comentario de la mascota). */
export function bodyExtremes(body: Body): { biggest: Stat; smallest: Stat; gap: number } {
  const sorted = [...STATS].sort((a, b) => body[a] - body[b])
  const smallest = sorted[0]!
  const biggest = sorted.at(-1)!
  return { biggest, smallest, gap: body[biggest] - body[smallest] }
}
