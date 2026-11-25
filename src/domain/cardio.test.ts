import { describe, expect, it } from 'vitest'
import { cardioKcal, waterTargetMl } from './cardio'

describe('cardio y agua', () => {
  it('kcal = MET × kg × horas', () => {
    expect(cardioKcal('football', 'moderate', 60, 75)).toBe(525) // 7 × 75 × 1
    expect(cardioKcal('cycling', 'light', 30, 80)).toBe(160) // 4 × 80 × 0,5
    expect(cardioKcal('running', 'vigorous', 0, 75)).toBe(0)
  })

  it('objetivo de agua orientativo', () => {
    expect(waterTargetMl(75.5)).toBe(2750) // 2642 → 2750
    expect(waterTargetMl(60)).toBe(2000) // 2100 → 2000
  })
})
