import { describe, expect, it } from 'vitest'
import {
  bestSet,
  compareSessions,
  detectRecords,
  e1rm,
  formatDuration,
  nextInRotation,
  restRemaining,
  setVolume,
  suggestIncrease,
  totalVolume,
  type SetLike,
} from './workout'

const s = (
  weightKg: number | null,
  repetitions: number | null,
  extra: Partial<SetLike> = {},
): SetLike => ({
  weightKg,
  repetitions,
  isCompleted: true,
  setType: 'normal',
  ...extra,
})

describe('entrenamiento', () => {
  it('volumen solo de series completadas, de trabajo y con carga', () => {
    expect(setVolume(s(60, 8), 'weighted')).toBe(480)
    expect(setVolume(s(60, 8, { isCompleted: false }), 'weighted')).toBe(0)
    expect(setVolume(s(40, 10, { setType: 'warmup' }), 'weighted')).toBe(0)
    expect(setVolume(s(0, 12), 'bodyweight')).toBe(0)
    expect(
      totalVolume([
        { set: s(60, 8), type: 'weighted' },
        { set: s(62.5, 6), type: 'weighted' },
      ]),
    ).toBe(855)
  })

  it('e1RM con Epley', () => {
    expect(e1rm(100, 1)).toBe(100)
    expect(e1rm(80, 8)).toBe(101.3)
    expect(e1rm(0, 5)).toBe(0)
    expect(bestSet([s(80, 8), s(90, 3), s(85, 6, { setType: 'warmup' })])).toEqual({
      weightKg: 80,
      repetitions: 8,
      e1rm: 101.3,
    })
  })

  it('detecta récords de peso y de 1RM estimado, nunca en la primera vez', () => {
    const history = new Map([['bench', [s(80, 6)]]])
    expect(detectRecords(new Map([['bench', [s(82.5, 5)]]]), history)).toEqual([
      { exerciseId: 'bench', kind: 'weight', value: 82.5, previous: 80 },
    ])
    expect(detectRecords(new Map([['bench', [s(80, 9)]]]), history)).toEqual([
      { exerciseId: 'bench', kind: 'e1rm', value: 104, previous: 96 },
    ])
    expect(detectRecords(new Map([['squat', [s(100, 5)]]]), history)).toEqual([])
  })

  it('compara con la sesión anterior', () => {
    expect(
      compareSessions(
        { volume: 5500, sets: 16, durationSeconds: 3600 },
        { volume: 5000, sets: 15, durationSeconds: 3900 },
      ),
    ).toEqual({
      volumeDiff: 500,
      volumePct: 10,
      setsDiff: 1,
      durationDiff: -300,
    })
    expect(compareSessions({ volume: 1, sets: 1, durationSeconds: 1 }, null)).toBeNull()
  })

  it('rotación de rutinas', () => {
    const t = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(nextInRotation(t, null)?.id).toBe('a')
    expect(nextInRotation(t, 'a')?.id).toBe('b')
    expect(nextInRotation(t, 'c')?.id).toBe('a')
    expect(nextInRotation(t, 'borrada')?.id).toBe('a')
    expect(nextInRotation([], 'a')).toBeNull()
  })

  it('duración y descanso', () => {
    expect(formatDuration(3127)).toBe('52:07')
    expect(formatDuration(3912)).toBe('1:05:12')
    expect(formatDuration(5)).toBe('0:05')
    expect(restRemaining(10_000, 8_500)).toBe(2)
    expect(restRemaining(10_000, 12_000)).toBe(0)
  })

  it('sugiere subir peso solo si completó el tope del rango en todas las series', () => {
    expect(suggestIncrease([s(60, 10), s(60, 10), s(60, 10)], 10)).toBe(62.5)
    expect(suggestIncrease([s(60, 10), s(60, 9)], 10)).toBeNull()
    expect(suggestIncrease([], 10)).toBeNull()
  })
})
