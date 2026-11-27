import { describe, expect, it } from 'vitest'
import { strengthIndex } from './strength-index'
import type { ExerciseSetFact } from './gamification'

const fact = (
  date: string,
  exerciseId: string,
  bestE1rm: number,
  muscle: ExerciseSetFact['muscle'],
): ExerciseSetFact => ({ date, exerciseId, bestE1rm, muscle, maxWeight: bestE1rm, sets: 3 })

describe('índice de fuerza', () => {
  it('arranca en 100 y promedia la mejora de cada ejercicio', () => {
    const pts = strengthIndex([
      fact('2026-11-01', 'bench', 80, 'chest'),
      fact('2026-11-01', 'squat', 100, 'quads'),
      fact('2026-11-08', 'bench', 88, 'chest'), // +10 %
      fact('2026-11-15', 'squat', 120, 'quads'), // +20 %
    ])
    expect(pts.map((p) => p.date)).toEqual(['2026-11-01', '2026-11-08', '2026-11-15'])
    expect(pts[0]!.value).toBeCloseTo(100)
    expect(pts[1]!.value).toBeCloseTo(105)
    expect(pts[2]!.value).toBeCloseTo(115)
  })

  it('filtra por grupo muscular', () => {
    const pts = strengthIndex(
      [
        fact('2026-11-01', 'bench', 80, 'chest'),
        fact('2026-11-01', 'squat', 100, 'quads'),
        fact('2026-11-08', 'squat', 120, 'quads'),
      ],
      'legs',
    )
    expect(pts.map((p) => Math.round(p.value))).toEqual([100, 120])
  })

  it('un ejercicio nuevo entra en 100 sin bajar el índice', () => {
    const pts = strengthIndex([
      fact('2026-11-01', 'bench', 80, 'chest'),
      fact('2026-11-08', 'bench', 96, 'chest'),
      fact('2026-11-08', 'row', 70, 'back'),
    ])
    expect(pts.at(-1)!.value).toBeCloseTo(110)
  })
})
