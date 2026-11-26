import { describe, expect, it } from 'vitest'
import { GLOBAL_EXERCISES } from '@/data/global-exercises'
import type { SplitStyle } from '@/types/models'
import {
  allGeneratorExerciseNames,
  EASE_LEGS_NOTE,
  exercisesPerSession,
  generateRoutines,
  prescription,
  recommendedSplit,
  sortWeekdays,
  type GeneratorInput,
} from './routine-generator'

const base: GeneratorInput = {
  daysPerWeek: 3,
  split: 'classic',
  easeLegs: false,
  sessionMinutes: 60,
  place: 'gym',
  goal: 'muscle',
  experience: 'intermediate',
}
const byId = new Map(GLOBAL_EXERCISES.map((e) => [e.id, e]))
const names = (input: Partial<GeneratorInput>) =>
  generateRoutines({ ...base, ...input }, GLOBAL_EXERCISES).map((t) => t.name)

describe('generador de rutinas', () => {
  it('todos los ejercicios que usa existen en la biblioteca', () => {
    const lib = new Set(GLOBAL_EXERCISES.map((e) => e.name.toLowerCase()))
    expect(allGeneratorExerciseNames().filter((n) => !lib.has(n.toLowerCase()))).toEqual([])
  })

  it('split clásico: Chest & Triceps / Back & Biceps / Legs & Shoulders', () => {
    expect(names({ split: 'classic', daysPerWeek: 3 })).toEqual([
      'Chest & Triceps',
      'Back & Biceps',
      'Legs & Shoulders',
    ])
    expect(names({ split: 'classic', daysPerWeek: 4 })).toEqual([
      'Chest & Triceps',
      'Back & Biceps',
      'Legs & Calves',
      'Shoulders & Core',
    ])
    expect(names({ split: 'classic', daysPerWeek: 6 })).toHaveLength(5)
  })

  it('PPL con core en el día de espalda y variantes B con 5+ días', () => {
    expect(names({ split: 'ppl', daysPerWeek: 3 })).toEqual([
      'Chest, Shoulders & Triceps',
      'Back, Biceps & Core',
      'Legs & Calves',
    ])
    expect(names({ split: 'ppl', daysPerWeek: 6 })).toHaveLength(6)
  })

  it('full body y upper/lower', () => {
    expect(names({ split: 'full_body', daysPerWeek: 2 })).toEqual(['Full Body A', 'Full Body B'])
    expect(names({ split: 'full_body', daysPerWeek: 3 })).toHaveLength(3)
    expect(names({ split: 'upper_lower', daysPerWeek: 4 })).toEqual([
      'Upper A',
      'Lower A',
      'Upper B',
      'Lower B',
    ])
  })

  it('las rutinas no tienen días fijos (rotan)', () => {
    expect(generateRoutines(base, GLOBAL_EXERCISES).every((t) => t.weekdays.length === 0)).toBe(
      true,
    )
  })

  it('los días con core incluyen abdominales y los de piernas incluyen gemelos', () => {
    const r = generateRoutines({ ...base, split: 'ppl', sessionMinutes: 45 }, GLOBAL_EXERCISES)
    const muscles = (i: number) => r[i]!.exercises.map((e) => byId.get(e.exerciseId)?.primaryMuscle)
    expect(muscles(1)).toContain('abs')
    expect(muscles(2)).toContain('calves')
  })

  it('la duración define los ejercicios principales y no repite en el día', () => {
    for (const split of ['full_body', 'upper_lower', 'ppl', 'classic'] as SplitStyle[]) {
      for (const minutes of [45, 60, 75, 90]) {
        for (const t of generateRoutines(
          { ...base, split, daysPerWeek: 5, sessionMinutes: minutes },
          GLOBAL_EXERCISES,
        )) {
          expect(t.exercises.length).toBeGreaterThanOrEqual(
            Math.min(4, exercisesPerSession(minutes)),
          )
          expect(t.exercises.length).toBeLessThanOrEqual(exercisesPerSession(minutes) + 3)
          expect(new Set(t.exercises.map((e) => e.exerciseId)).size).toBe(t.exercises.length)
        }
      }
    }
  })

  it('en casa solo usa mancuernas, peso corporal u otros', () => {
    for (const split of ['full_body', 'upper_lower', 'ppl', 'classic'] as SplitStyle[]) {
      for (const t of generateRoutines(
        { ...base, split, daysPerWeek: 5, place: 'home', sessionMinutes: 90 },
        GLOBAL_EXERCISES,
      )) {
        expect(t.exercises.length).toBeGreaterThanOrEqual(3)
        for (const e of t.exercises) {
          expect(['dumbbell', 'bodyweight', 'other']).toContain(byId.get(e.exerciseId)?.equipment)
        }
      }
    }
  })

  it('piernas de a poco: menos series, más reps y más RIR solo en piernas', () => {
    const normal = generateRoutines({ ...base, split: 'ppl' }, GLOBAL_EXERCISES)[2]!
    const eased = generateRoutines({ ...base, split: 'ppl', easeLegs: true }, GLOBAL_EXERCISES)[2]!
    const squatN = normal.exercises[0]!
    const squatE = eased.exercises[0]!
    expect(squatE.sets).toBe(squatN.sets - 1)
    expect(squatE.repsMin).toBeGreaterThanOrEqual(10)
    expect(squatE.rir).toBeGreaterThanOrEqual(3)
    expect(eased.notes).toBe(EASE_LEGS_NOTE)
    // El día de pecho no cambia
    const chest = generateRoutines({ ...base, split: 'ppl', easeLegs: true }, GLOBAL_EXERCISES)[0]!
    expect(chest.notes).toBeNull()
  })

  it('split recomendado', () => {
    expect(recommendedSplit('beginner', 3)).toBe('full_body')
    expect(recommendedSplit('beginner', 4)).toBe('upper_lower')
    expect(recommendedSplit('intermediate', 3)).toBe('ppl')
    expect(recommendedSplit('advanced', 4)).toBe('upper_lower')
  })

  it('prescripción según objetivo y experiencia', () => {
    expect(prescription('main', 'strength', 'advanced', 'weighted')).toMatchObject({
      sets: 4,
      repsMin: 3,
      repsMax: 6,
    })
    expect(prescription('main', 'muscle', 'beginner', 'weighted')).toMatchObject({
      repsMin: 8,
      repsMax: 12,
      rir: 3,
    })
    expect(prescription('accessory', 'muscle', 'intermediate', 'timed')).toMatchObject({
      repsMin: 30,
      repsMax: 60,
    })
  })

  it('sortWeekdays ordena de lunes a domingo', () => {
    expect(sortWeekdays([0, 3, 1, 3])).toEqual([1, 3, 0])
  })
})

describe('lesiones y preferencias', () => {
  const base = {
    daysPerWeek: 4,
    split: 'upper_lower' as const,
    easeLegs: false,
    sessionMinutes: 60,
    place: 'gym' as const,
    goal: 'muscle' as const,
    experience: 'intermediate' as const,
  }
  const names = (r: ReturnType<typeof generateRoutines>) => {
    const byId = new Map(GLOBAL_EXERCISES.map((e) => [e.id, e.name]))
    return r.flatMap((d) => d.exercises.map((e) => byId.get(e.exerciseId)!))
  }

  it('con lesiones evita los ejercicios de riesgo y los reemplaza', () => {
    const r = generateRoutines(
      { ...base, injuries: ['knee', 'lower_back', 'shoulder'] },
      GLOBAL_EXERCISES,
    )
    const all = names(r)
    for (const bad of [
      'Barbell Back Squat',
      'Romanian Deadlift',
      'Barbell Row',
      'Barbell Overhead Press',
      'Barbell Bench Press',
    ])
      expect(all).not.toContain(bad)
    expect(all).toContain('Leg Press')
    // Ninguna rutina queda vacía
    for (const d of r) expect(d.exercises.length).toBeGreaterThanOrEqual(3)
  })

  it('la preferencia por máquinas cambia la elección', () => {
    const free = names(generateRoutines({ ...base, equipmentPref: 'free' }, GLOBAL_EXERCISES))
    const machines = names(
      generateRoutines({ ...base, equipmentPref: 'machines' }, GLOBAL_EXERCISES),
    )
    expect(machines).not.toEqual(free)
  })

  it('sin lesiones ni preferencia, no cambia nada', () => {
    expect(names(generateRoutines(base, GLOBAL_EXERCISES))).toEqual(
      names(generateRoutines({ ...base, injuries: [], equipmentPref: 'mixed' }, GLOBAL_EXERCISES)),
    )
  })
})
