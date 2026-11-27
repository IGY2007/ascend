import { describe, expect, it } from 'vitest'
import { CAMPS, journeyPosition } from './journey'
import { MAX_LEVEL } from './gamification'

describe('el viaje', () => {
  it('tiene un checkpoint cada 5 niveles y termina en el Olimpo (nivel 100)', () => {
    expect(CAMPS).toHaveLength(21)
    CAMPS.slice(1).forEach((c, i) => expect(c.level).toBe((i + 1) * 5))
    expect(CAMPS.at(-1)).toMatchObject({ id: 'olympus', level: MAX_LEVEL })
  })

  it('ubica en qué checkpoint estás y cuánto falta para el próximo', () => {
    expect(journeyPosition(1)).toMatchObject({ index: 0 })
    const p = journeyPosition(7, 50, 100) // entre el 5 y el 10
    expect(p.current.id).toBe('gymnasion')
    expect(p.next?.id).toBe('technique')
    expect(p.progress).toBeCloseTo(0.5)
    expect(journeyPosition(100)).toMatchObject({ next: null, progress: 1 })
  })
})
