import type { Sex } from '@/types/models'

/** IMC = peso / altura² (kg/m²). Es un indicador grueso: no distingue músculo de grasa. */
export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}

export type BmiCategory = 'under' | 'normal' | 'over' | 'obese'

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'under'
  if (value < 25) return 'normal'
  if (value < 30) return 'over'
  return 'obese'
}

/**
 * % de grasa APROXIMADO con la fórmula de Deurenberg (IMC, edad y sexo).
 * Error típico de ±4–5 puntos y sobreestima en personas musculosas. Solo orientativo.
 */
export function bodyFatEstimate(bmiValue: number, age: number, sex: Sex): number {
  const pct = 1.2 * bmiValue + 0.23 * age - 10.8 * (sex === 'male' ? 1 : 0) - 5.4
  return Math.round(Math.min(60, Math.max(3, pct)) * 10) / 10
}
