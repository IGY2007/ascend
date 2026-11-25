import type { ActivityLevel, Goal, MacroTargets, Sex } from '@/types/models'

/**
 * Estimación de calorías y macros. NO es una recomendación médica: es un punto de partida
 * editable, basado en fórmulas estándar.
 *
 * 1. Metabolismo basal (BMR) con Mifflin-St Jeor.
 * 2. Gasto diario (TDEE) = BMR × factor de actividad. El factor combina la actividad diaria
 *    (sin contar el gym) con los días de entrenamiento: 0,075 por día semanal.
 * 3. Ajuste por objetivo (superávit/déficit).
 * 4. Proteína por kg de peso, grasa ≥ 25 % de las calorías (mín. 0,6 g/kg), carbohidratos el resto.
 */

export interface NutritionInput {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: ActivityLevel
  trainingDaysPerWeek: number
  goal: Goal
}

const BASE_ACTIVITY: Record<ActivityLevel, number> = {
  sedentary: 1.25,
  light: 1.35,
  active: 1.45,
  very_active: 1.6,
}

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  muscle: 0.1,
  strength: 0.05,
  recomp: 0,
  fat_loss: -0.2,
}

/**
 * Protein per kg of body weight. Morton et al. 2018 (BJSM meta-analysis): gains plateau around
 * 1.6 g/kg with an upper bound near 2.2 g/kg; ISSN recommends 1.4–2.0 g/kg and more during a
 * deficit. We aim at 2.0 to build and 2.2 when losing fat or recomposing (protects muscle).
 */
export const PROTEIN_PER_KG: Record<Goal, number> = {
  muscle: 2.0,
  strength: 2.0,
  recomp: 2.2,
  fat_loss: 2.2,
}

export function bmrMifflinStJeor({ sex, age, heightCm, weightKg }: NutritionInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

export function activityFactor(activity: ActivityLevel, trainingDaysPerWeek: number): number {
  const days = Math.max(0, Math.min(7, trainingDaysPerWeek))
  return Math.min(2, BASE_ACTIVITY[activity] + 0.075 * days)
}

export function maintenanceKcal(input: NutritionInput): number {
  return bmrMifflinStJeor(input) * activityFactor(input.activity, input.trainingDaysPerWeek)
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step

export function calculateMacros(input: NutritionInput): MacroTargets {
  const kcal = roundTo(maintenanceKcal(input) * (1 + GOAL_ADJUSTMENT[input.goal]), 10)
  const proteinG = roundTo(input.weightKg * PROTEIN_PER_KG[input.goal], 5)
  const fatG = roundTo(Math.max((kcal * 0.25) / 9, input.weightKg * 0.6), 5)
  const carbsG = Math.max(0, roundTo((kcal - proteinG * 4 - fatG * 9) / 4, 5))
  return { kcal, proteinG, carbsG, fatG }
}

/** Calorías a partir de los macros (4/4/9 kcal por gramo). */
export function kcalFromMacros({ proteinG, carbsG, fatG }: Omit<MacroTargets, 'kcal'>): number {
  return Math.round(proteinG * 4 + carbsG * 4 + fatG * 9)
}
