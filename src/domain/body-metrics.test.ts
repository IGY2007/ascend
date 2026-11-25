import { describe, expect, it } from 'vitest'
import { bmi, bmiCategory, bodyFatEstimate } from './body-metrics'

describe('métricas corporales', () => {
  it('IMC', () => {
    expect(bmi(75.5, 178)).toBe(23.8)
    expect(bmiCategory(23.8)).toBe('normal')
    expect(bmiCategory(17)).toBe('under')
    expect(bmiCategory(27)).toBe('over')
    expect(bmiCategory(31)).toBe('obese')
  })

  it('% de grasa aproximado (Deurenberg)', () => {
    // 1,2·23,8 + 0,23·25 − 10,8 − 5,4 = 18,11
    expect(bodyFatEstimate(23.8, 25, 'male')).toBe(18.1)
    expect(bodyFatEstimate(23.8, 25, 'female')).toBe(28.9)
  })
})
