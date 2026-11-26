import type { Facts, Stat } from './gamification'
import { STATS, statOf } from './gamification'
import type { Sex } from '@/types/models'

/**
 * El personaje del usuario: se arma con detalles chicos (piel, pelo, ropa, accesorio) y su cuerpo
 * crece según lo que entrenó cada grupo muscular EN EL MES. El 1° de cada mes vuelve a empezar.
 */

export const SKINS = ['#f6d3b8', '#e9b48f', '#c98e66', '#a0673f', '#704629', '#4a2e1c'] as const
export const HAIR_COLORS = [
  '#1f1a17',
  '#4b2e1e',
  '#8a5a2b',
  '#d9b26b',
  '#b5472e',
  '#a1a1aa',
  '#8b5cf6',
] as const
export const SHIRT_COLORS = [
  '#8b5cf6',
  '#a3e635',
  '#f4f4f5',
  '#3f3f46',
  '#ef4444',
  '#3b82f6',
  '#f59e0b',
] as const

export const HAIR_STYLES = ['short', 'buzz', 'curly', 'long', 'bun', 'mohawk', 'bald'] as const
export const FACIAL = ['none', 'stubble', 'beard', 'mustache'] as const
export const OUTFITS = ['tank', 'tee', 'shirtless'] as const
export const ACCESSORIES = ['none', 'headband', 'cap', 'glasses', 'chain'] as const

export type HairStyle = (typeof HAIR_STYLES)[number]
export type Facial = (typeof FACIAL)[number]
export type Outfit = (typeof OUTFITS)[number]
export type Accessory = (typeof ACCESSORIES)[number]

export interface AvatarConfig {
  skin: number
  hair: HairStyle
  hairColor: number
  facial: Facial
  outfit: Outfit
  shirtColor: number
  accessory: Accessory
}

export function defaultAvatar(sex?: Sex): AvatarConfig {
  return {
    skin: 1,
    hair: sex === 'female' ? 'long' : 'short',
    hairColor: 1,
    facial: 'none',
    outfit: 'tank',
    shirtColor: 0,
    accessory: 'none',
  }
}

/** Personaje al azar (botón del dado). `random` inyectable para tests. */
export function randomAvatar(random: () => number = Math.random): AvatarConfig {
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)]!
  const idx = (n: number) => Math.floor(random() * n)
  return {
    skin: idx(SKINS.length),
    hair: pick(HAIR_STYLES),
    hairColor: idx(HAIR_COLORS.length),
    facial: pick(FACIAL),
    outfit: pick(OUTFITS),
    shirtColor: idx(SHIRT_COLORS.length),
    accessory: pick(ACCESSORIES),
  }
}

/** Normaliza lo guardado (por si cambian las opciones en una versión futura). */
export function sanitizeAvatar(a: Partial<AvatarConfig> | undefined, sex?: Sex): AvatarConfig {
  const d = defaultAvatar(sex)
  if (!a) return d
  const inList = <T>(list: readonly T[], v: unknown, fallback: T): T =>
    list.includes(v as T) ? (v as T) : fallback
  const inRange = (v: unknown, n: number, fallback: number) =>
    typeof v === 'number' && v >= 0 && v < n ? v : fallback
  return {
    skin: inRange(a.skin, SKINS.length, d.skin),
    hair: inList(HAIR_STYLES, a.hair, d.hair),
    hairColor: inRange(a.hairColor, HAIR_COLORS.length, d.hairColor),
    facial: inList(FACIAL, a.facial, d.facial),
    outfit: inList(OUTFITS, a.outfit, d.outfit),
    shirtColor: inRange(a.shirtColor, SHIRT_COLORS.length, d.shirtColor),
    accessory: inList(ACCESSORIES, a.accessory, d.accessory),
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

/** Cuánto creció cada grupo este mes: 0 (recién empieza) a 1 (máximo). Curva suave: rinde al principio. */
export function bodyFromSets(sets: Body): Body {
  const out = { ...EMPTY_BODY }
  for (const s of STATS) out[s] = Math.min(1, Math.sqrt(sets[s] / MONTH_MAX_SETS[s]))
  return out
}

/** El grupo más chico y el más grande (para el comentario gracioso de la mascota). */
export function bodyExtremes(body: Body): { biggest: Stat; smallest: Stat; gap: number } {
  const sorted = [...STATS].sort((a, b) => body[a] - body[b])
  const smallest = sorted[0]!
  const biggest = sorted.at(-1)!
  return { biggest, smallest, gap: body[biggest] - body[smallest] }
}
