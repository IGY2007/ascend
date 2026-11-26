import { describe, expect, it } from 'vitest'
import {
  bodyExtremes,
  bodyFromSets,
  defaultAvatar,
  EMPTY_BODY,
  monthSets,
  randomAvatar,
  sanitizeAvatar,
} from './avatar'
import type { Facts } from './gamification'

const facts: Facts = {
  sessions: [],
  prs: [],
  cardio: [],
  waterGoalDays: [],
  weightLogs: [],
  weekGoal: 3,
  exerciseSets: [
    {
      date: '2026-11-03',
      exerciseId: 'bench',
      muscle: 'chest',
      sets: 24,
      bestE1rm: 90,
      maxWeight: 70,
    },
    {
      date: '2026-11-05',
      exerciseId: 'curl',
      muscle: 'biceps',
      sets: 12,
      bestE1rm: 20,
      maxWeight: 15,
    },
    {
      date: '2026-11-05',
      exerciseId: 'push',
      muscle: 'triceps',
      sets: 12,
      bestE1rm: 20,
      maxWeight: 15,
    },
    {
      date: '2026-10-30',
      exerciseId: 'squat',
      muscle: 'quads',
      sets: 30,
      bestE1rm: 120,
      maxWeight: 100,
    },
  ],
}

describe('personaje', () => {
  it('cuenta solo las series del mes (se reinicia cada mes)', () => {
    const sets = monthSets(facts, 2026, 10)
    expect(sets.chest).toBe(24)
    expect(sets.arms).toBe(24)
    expect(sets.legs).toBe(0) // la sentadilla fue en octubre
    expect(monthSets(facts, 2026, 9).legs).toBe(30)
  })

  it('crece con curva suave y tope en 1', () => {
    const body = bodyFromSets({ ...EMPTY_BODY, chest: 12, arms: 48, legs: 500 })
    expect(body.chest).toBeCloseTo(0.5)
    expect(body.arms).toBe(1)
    expect(body.legs).toBe(1)
    expect(body.back).toBe(0)
  })

  it('detecta al que se salteó piernas', () => {
    const body = bodyFromSets(monthSets(facts, 2026, 10))
    const { biggest, smallest, gap } = bodyExtremes(body)
    expect(['chest', 'arms']).toContain(biggest)
    expect(body[smallest]).toBe(0)
    expect(gap).toBeGreaterThan(0.5)
  })

  it('el personaje guardado se normaliza y el azar da opciones válidas', () => {
    expect(defaultAvatar('female').hair).toBe('long')
    expect(sanitizeAvatar({ skin: 99, hair: 'nope' as never }, 'male')).toEqual(
      defaultAvatar('male'),
    )
    const r = randomAvatar(() => 0.999)
    expect(sanitizeAvatar(r)).toEqual(r)
  })
})
