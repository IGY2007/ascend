import { describe, expect, it } from 'vitest'
import { dailySums, pctChange, weekStreak, weeklySums } from './progress-stats'

describe('estadísticas de progreso', () => {
  it('suma por semana de lunes a domingo', () => {
    const items = [
      { date: '2026-11-16', value: 100 }, // lun semana anterior
      { date: '2026-11-22', value: 50 }, // dom semana anterior
      { date: '2026-11-23', value: 200 }, // lun semana actual
      { date: '2026-11-25', value: 10 },
    ]
    expect(weeklySums(items, '2026-11-25', 3)).toEqual([
      { weekStart: '2026-11-09', value: 0 },
      { weekStart: '2026-11-16', value: 150 },
      { weekStart: '2026-11-23', value: 210 },
    ])
  })

  it('suma por día', () => {
    expect(
      dailySums(
        [
          { date: '2026-11-25', value: 250 },
          { date: '2026-11-25', value: 500 },
        ],
        '2026-11-25',
        2,
      ),
    ).toEqual([
      { date: '2026-11-24', value: 0 },
      { date: '2026-11-25', value: 750 },
    ])
  })

  it('racha de semanas cumpliendo la meta', () => {
    const dates = ['2026-11-09', '2026-11-11', '2026-11-16', '2026-11-18', '2026-11-23']
    expect(weekStreak(dates, '2026-11-25', 2)).toBe(2) // la actual (1/2) no corta la racha
    expect(weekStreak([...dates, '2026-11-24'], '2026-11-25', 2)).toBe(3)
    expect(weekStreak(dates, '2026-11-25', 3)).toBe(0)
  })

  it('porcentaje de cambio', () => {
    expect(pctChange(110, 100)).toBe(10)
    expect(pctChange(5, 0)).toBeNull()
  })
})
