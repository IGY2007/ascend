import { describe, expect, it } from 'vitest'
import { GLOBAL_EXERCISES } from '@/data/global-exercises'
import type { Weekday } from '@/types/models'
import {
  allGeneratorExerciseNames,
  exercisesPerSession,
  generateRoutines,
  prescription,
  sortWeekdays,
  type GeneratorInput,
} from './routine-generator'

const base: GeneratorInput = {
  trainingDays: [1, 2, 4, 5],
  sessionMinutes: 60,
  place: 'gym',
  goal: 'muscle',
  experience: 'intermediate',
}
const byId = new Map(GLOBAL_EXERCISES.map((e) => [e.id, e]))

describe('generador de rutinas', () => {
  it('todos los ejercicios que usa existen en la biblioteca', () => {
    const names = new Set(GLOBAL_EXERCISES.map((e) => e.name.toLowerCase()))
    const missing = allGeneratorExerciseNames().filter((n) => !names.has(n.toLowerCase()))
    expect(missing).toEqual([])
  })

  it.each([
    [
      [1, 4],
      ['Full Body A', 'Full Body B'],
    ],
    [
      [1, 3, 5],
      ['Full Body A', 'Full Body B', 'Full Body C'],
    ],
    [
      [1, 2, 4, 5],
      ['Upper A', 'Lower A', 'Upper B', 'Lower B'],
    ],
    [
      [1, 2, 3, 4, 5],
      ['Upper A', 'Lower A', 'Push A', 'Pull A', 'Legs B'],
    ],
    [
      [1, 2, 3, 4, 5, 6],
      ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'],
    ],
  ] as [Weekday[], string[]][])('%j días → split correcto', (days, names) => {
    const r = generateRoutines({ ...base, trainingDays: days }, GLOBAL_EXERCISES)
    expect(r.map((t) => t.name)).toEqual(names)
  })

  it('asigna cada rutina a uno de los días elegidos, de lunes a domingo', () => {
    const r = generateRoutines({ ...base, trainingDays: [0, 2, 4, 6] }, GLOBAL_EXERCISES)
    expect(r.map((t) => t.weekdays)).toEqual([[2], [4], [6], [0]])
  })

  it('con 7 días deja uno libre', () => {
    const r = generateRoutines({ ...base, trainingDays: [0, 1, 2, 3, 4, 5, 6] }, GLOBAL_EXERCISES)
    expect(r).toHaveLength(6)
  })

  it('la duración define la cantidad de ejercicios y no repite en el mismo día', () => {
    for (const minutes of [45, 60, 75, 90]) {
      const r = generateRoutines({ ...base, sessionMinutes: minutes }, GLOBAL_EXERCISES)
      for (const t of r) {
        expect(t.exercises.length).toBe(exercisesPerSession(minutes))
        expect(new Set(t.exercises.map((e) => e.exerciseId)).size).toBe(t.exercises.length)
      }
    }
  })

  it('en casa solo usa mancuernas, peso corporal u otros', () => {
    for (const days of [
      [1, 4],
      [1, 3, 5],
      [1, 2, 4, 5],
      [1, 2, 3, 4, 5],
      [1, 2, 3, 4, 5, 6],
    ] as Weekday[][]) {
      const r = generateRoutines(
        { ...base, trainingDays: days, place: 'home', sessionMinutes: 90 },
        GLOBAL_EXERCISES,
      )
      for (const t of r) {
        expect(t.exercises.length).toBeGreaterThanOrEqual(4)
        for (const e of t.exercises) {
          expect(['dumbbell', 'bodyweight', 'other']).toContain(byId.get(e.exerciseId)?.equipment)
        }
      }
    }
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
    expect(prescription('accessory', 'fat_loss', 'intermediate', 'weighted')).toMatchObject({
      repsMin: 10,
      repsMax: 15,
      rir: 1,
    })
    expect(prescription('accessory', 'muscle', 'intermediate', 'timed')).toMatchObject({
      repsMin: 30,
      repsMax: 60,
    })
  })

  it('sortWeekdays ordena de lunes a domingo y quita duplicados', () => {
    expect(sortWeekdays([0, 3, 1, 3])).toEqual([1, 3, 0])
  })
})
