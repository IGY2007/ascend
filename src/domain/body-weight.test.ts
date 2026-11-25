import { describe, expect, it } from 'vitest'
import { filterRange, weeklyAverage, weightStats } from './body-weight'

const pts = [
  { date: '2026-11-10', weightKg: 76 },
  { date: '2026-11-12', weightKg: 75.6 },
  { date: '2026-11-17', weightKg: 75.4 },
  { date: '2026-11-19', weightKg: 75.0 },
  { date: '2026-11-23', weightKg: 74.8 },
  { date: '2026-11-25', weightKg: 74.6 },
]

describe('peso corporal', () => {
  it('promedio semanal de los 7 días que terminan hoy', () => {
    expect(weeklyAverage(pts, '2026-11-25')).toBe(74.8) // 19, 23, 25 → (75 + 74,8 + 74,6) / 3
    expect(weeklyAverage(pts, '2026-11-05')).toBeNull()
  })

  it('estadísticas: cambio semanal, total y lo que falta al objetivo', () => {
    const s = weightStats(pts, '2026-11-25', 72)
    expect(s.latest?.weightKg).toBe(74.6)
    expect(s.weekChange).toBe(-0.7) // 74,8 − 75,5 (semana anterior: 12 y 17)
    expect(s.totalChange).toBe(-1.4)
    expect(s.toTarget).toBe(-2.6)
  })

  it('sin datos no inventa números', () => {
    expect(weightStats([], '2026-11-25', 80)).toEqual({
      latest: null,
      weekAvg: null,
      weekChange: null,
      totalChange: null,
      toTarget: null,
    })
  })

  it('filtra por rango de días', () => {
    expect(filterRange(pts, '2026-11-25', 7).map((p) => p.date)).toEqual([
      '2026-11-19',
      '2026-11-23',
      '2026-11-25',
    ])
    expect(filterRange(pts, '2026-11-25', null)).toHaveLength(6)
  })
})
