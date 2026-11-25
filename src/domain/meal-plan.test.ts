import { describe, expect, it } from 'vitest'
import { mealPlan } from './meal-plan'

const macros = { proteinG: 160, carbsG: 390, fatG: 70 }

describe('mealPlan', () => {
  it('respeta los totales del día', () => {
    for (const time of ['morning', 'midday', 'evening'] as const) {
      const meals = mealPlan(macros, time)
      expect(meals.reduce((s, m) => s + m.proteinG, 0)).toBe(160)
      expect(meals.reduce((s, m) => s + m.carbsG, 0)).toBe(390)
      expect(meals.reduce((s, m) => s + m.fatG, 0)).toBe(70)
    }
  })

  it('pone más carbohidratos y menos grasa alrededor del entrenamiento', () => {
    const meals = mealPlan(macros, 'evening')
    const pre = meals.find((m) => m.key === 'pre')!
    const post = meals.find((m) => m.key === 'post')!
    const lunch = meals.find((m) => m.key === 'lunch')!
    expect(post.carbsG).toBeGreaterThan(lunch.carbsG)
    expect(pre.carbsG).toBeGreaterThan(lunch.carbsG)
    expect(pre.fatG).toBeLessThan(lunch.fatG)
  })

  it('el orden sigue el horario de entrenamiento', () => {
    expect(mealPlan(macros, 'morning')[0]!.key).toBe('pre')
    expect(mealPlan(macros, 'evening').at(-1)!.key).toBe('beforeBed')
  })

  it('cada comida trae una dosis útil de proteína (20–40 g o más)', () => {
    for (const m of mealPlan(macros, 'midday')) expect(m.proteinG).toBeGreaterThanOrEqual(20)
  })
})
