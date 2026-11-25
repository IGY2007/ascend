import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, fromDateKey, startOfWeek, toDateKey } from './dates'

describe('fechas locales', () => {
  it('toDateKey usa la fecha local, no UTC', () => {
    // 00:30 local del 1 de marzo: en UTC+1 sería 28/29 de febrero con toISOString().
    expect(toDateKey(new Date(2026, 2, 1, 0, 30))).toBe('2026-03-01')
    expect(toDateKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })

  it('fromDateKey ida y vuelta', () => {
    expect(toDateKey(fromDateKey('2026-11-25'))).toBe('2026-11-25')
  })

  it('startOfWeek devuelve el lunes', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 10, 25)))).toBe('2026-11-23') // miércoles → lunes
    expect(toDateKey(startOfWeek(new Date(2026, 10, 29)))).toBe('2026-11-23') // domingo → lunes
    expect(toDateKey(startOfWeek(new Date(2026, 10, 23)))).toBe('2026-11-23')
  })

  it('addDays y daysBetween cruzan meses', () => {
    expect(toDateKey(addDays(new Date(2026, 10, 30), 1))).toBe('2026-12-01')
    expect(daysBetween('2026-11-25', '2026-12-02')).toBe(7)
  })
})
