import { describe, expect, it } from 'vitest'
import {
  bodyExtremes,
  bodyFromSets,
  defaultAvatar,
  EMPTY_BODY,
  monthSets,
  randomAvatar,
  sanitizeAvatar,
  isUnlocked,
  unlockOf,
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

  it('el personaje guardado se normaliza y migra el formato viejo', () => {
    expect(defaultAvatar('female')).toMatchObject({ body: 'female', hair: 'ponytail' })
    expect(sanitizeAvatar({ skin: 99, hair: 'nope' as never }, 'male')).toEqual(
      defaultAvatar('male'),
    )
    const old = sanitizeAvatar({ accessory: 'cap', outfit: 'shirtless', body: 'female' } as never)
    expect(old.headwear).toBe('cap')
    expect(old.outfit).toBe('sportsbra') // en cuero no existe para el cuerpo femenino
  })

  it('las opciones se desbloquean por nivel, logros o Pro', () => {
    const novato = { level: 1, achievements: new Set<string>(), pro: false }
    const veterano = { level: 6, achievements: new Set(['club_100', 'full_week']), pro: false }
    expect(isUnlocked(unlockOf('hair', 'short'), novato)).toBe(true)
    expect(isUnlocked(unlockOf('hair', 'mohawk'), novato)).toBe(false)
    expect(isUnlocked(unlockOf('hair', 'mohawk'), veterano)).toBe(true)
    expect(isUnlocked(unlockOf('extra', 'chain'), veterano)).toBe(true)
    expect(isUnlocked(unlockOf('headwear', 'crown'), veterano)).toBe(false) // solo Pro
    // El azar nunca da algo bloqueado
    for (let i = 0; i < 50; i++) {
      const r = randomAvatar(novato)
      for (const [k, v] of Object.entries(r)) {
        expect(isUnlocked(unlockOf(k as never, v as never), novato)).toBe(true)
      }
    }
  })
})
