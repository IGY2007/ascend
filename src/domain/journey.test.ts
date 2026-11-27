import { describe, expect, it } from 'vitest'
import { CAMPS, journeyPosition } from './journey'
import { LEVEL_TITLES } from './gamification'

describe('el viaje', () => {
  it('los campamentos coinciden con los títulos de nivel y terminan en el Olimpo', () => {
    expect(CAMPS.map((c) => c.level)).toEqual(LEVEL_TITLES.map(([l]) => l))
    expect(CAMPS.at(-1)!.id).toBe('olympus')
  })

  it('ubica en qué campamento estás y cuánto falta para el próximo', () => {
    expect(journeyPosition(1)).toMatchObject({ index: 0, progress: 0 })
    const p = journeyPosition(4, 50, 100) // entre el 3 (gimnasio griego) y el 5
    expect(p.current.id).toBe('gymnasion')
    expect(p.next?.id).toBe('strongmen')
    expect(p.progress).toBeCloseTo(0.75)
    expect(journeyPosition(30)).toMatchObject({ next: null, progress: 1 })
  })
})
