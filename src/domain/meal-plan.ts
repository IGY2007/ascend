import type { MacroTargets } from '@/types/models'

/**
 * Reparto de los macros del día en comidas, según cuándo entrenás. Guía general basada en la
 * evidencia de nutrición deportiva (ISSN 2017, ACSM 2016):
 * - Proteína repartida en partes parecidas (20–40 g por comida, ~0,25–0,4 g/kg).
 * - Más carbohidratos antes y después de entrenar; menos grasa y fibra antes (digestión más fácil).
 * - Con entrenamiento a la noche, una comida con proteína antes de dormir.
 */
export type TrainingTime = 'morning' | 'midday' | 'evening'
export type MealKey = 'breakfast' | 'lunch' | 'pre' | 'post' | 'dinner' | 'snack' | 'beforeBed'

export interface Meal {
  key: MealKey
  proteinG: number
  carbsG: number
  fatG: number
}

const ORDER: Record<TrainingTime, MealKey[]> = {
  morning: ['pre', 'post', 'lunch', 'snack', 'dinner'],
  midday: ['breakfast', 'pre', 'post', 'snack', 'dinner'],
  evening: ['breakfast', 'lunch', 'pre', 'post', 'beforeBed'],
}

// Peso relativo de cada comida para carbohidratos y grasas (se normaliza).
const CARB_WEIGHT: Record<MealKey, number> = {
  pre: 1.3,
  post: 1.5,
  breakfast: 1,
  lunch: 1,
  dinner: 0.8,
  snack: 0.5,
  beforeBed: 0.3,
}
const FAT_WEIGHT: Record<MealKey, number> = {
  pre: 0.4,
  post: 0.6,
  breakfast: 1.2,
  lunch: 1.3,
  dinner: 1.3,
  snack: 1,
  beforeBed: 0.8,
}
const PROTEIN_WEIGHT: Record<MealKey, number> = {
  pre: 0.8,
  post: 1.2,
  breakfast: 1,
  lunch: 1,
  dinner: 1,
  snack: 0.8,
  beforeBed: 1,
}

/** Reparte `total` según los pesos, redondeando a 5 g y cuadrando el total en la comida más grande. */
function split(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const parts = weights.map((w) => Math.round((total * w) / sum / 5) * 5)
  const diff = Math.round(total) - parts.reduce((a, b) => a + b, 0)
  const biggest = parts.indexOf(Math.max(...parts))
  parts[biggest] = Math.max(0, parts[biggest]! + diff)
  return parts
}

export function mealPlan(macros: Omit<MacroTargets, 'kcal'>, time: TrainingTime): Meal[] {
  const keys = ORDER[time]
  const protein = split(
    macros.proteinG,
    keys.map((k) => PROTEIN_WEIGHT[k]),
  )
  const carbs = split(
    macros.carbsG,
    keys.map((k) => CARB_WEIGHT[k]),
  )
  const fat = split(
    macros.fatG,
    keys.map((k) => FAT_WEIGHT[k]),
  )
  return keys.map((key, i) => ({
    key,
    proteinG: protein[i]!,
    carbsG: carbs[i]!,
    fatG: fat[i]!,
  }))
}
