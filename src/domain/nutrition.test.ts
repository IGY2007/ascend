import { describe, expect, it } from 'vitest'
import {
  activityFactor,
  bmrMifflinStJeor,
  calculateMacros,
  kcalFromMacros,
  maintenanceKcal,
  type NutritionInput,
} from './nutrition'

const base: NutritionInput = {
  sex: 'male',
  age: 25,
  heightCm: 178,
  weightKg: 75,
  activity: 'sedentary',
  trainingDaysPerWeek: 4,
  goal: 'muscle',
}

describe('nutrición', () => {
  it('BMR Mifflin-St Jeor', () => {
    // 10·75 + 6,25·178 − 5·25 + 5 = 1742,5
    expect(bmrMifflinStJeor(base)).toBeCloseTo(1742.5)
    expect(bmrMifflinStJeor({ ...base, sex: 'female' })).toBeCloseTo(1576.5)
  })

  it('factor de actividad: oficina + 4 días ≈ actividad moderada (1,55)', () => {
    expect(activityFactor('sedentary', 4)).toBeCloseTo(1.55)
    expect(activityFactor('very_active', 7)).toBeLessThanOrEqual(2)
  })

  it('el objetivo ajusta las calorías', () => {
    const tdee = maintenanceKcal(base)
    expect(calculateMacros(base).kcal).toBeCloseTo(tdee * 1.1, -1)
    expect(calculateMacros({ ...base, goal: 'fat_loss' }).kcal).toBeCloseTo(tdee * 0.8, -1)
    expect(calculateMacros({ ...base, goal: 'recomp' }).kcal).toBeCloseTo(tdee, -1)
  })

  it('macros coherentes con las calorías y la proteína por kg', () => {
    const m = calculateMacros(base)
    expect(m.proteinG).toBe(135) // 75 × 1,8 = 135
    expect(m.fatG * 9).toBeGreaterThanOrEqual(m.kcal * 0.24)
    expect(Math.abs(kcalFromMacros(m) - m.kcal)).toBeLessThan(40)
    expect(calculateMacros({ ...base, goal: 'fat_loss' }).proteinG).toBe(165)
  })

  it('nunca da carbohidratos negativos', () => {
    const m = calculateMacros({
      ...base,
      weightKg: 140,
      heightCm: 150,
      age: 70,
      sex: 'female',
      goal: 'fat_loss',
      trainingDaysPerWeek: 0,
    })
    expect(m.carbsG).toBeGreaterThanOrEqual(0)
  })
})
