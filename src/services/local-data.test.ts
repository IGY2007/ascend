import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import type { OnboardingAnswers } from '@/types/models'
import { toDateKey } from '@/domain/dates'
import { bodyWeightService, nutritionService, profileService, templatesService } from './local-data'

const answers: OnboardingAnswers = {
  name: 'Julian',
  sex: 'male',
  age: 25,
  heightCm: 178,
  weightKg: 75,
  goal: 'muscle',
  targetWeightKg: 80,
  activity: 'sedentary',
  experience: 'intermediate',
  trainingDays: [1, 2, 4, 5],
  sessionMinutes: 60,
  place: 'gym',
}

describe('datos locales', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('el cuestionario prepara perfil, macros, rutinas y peso inicial', async () => {
    await profileService.completeOnboarding(answers)
    expect((await profileService.get())?.name).toBe('Julian')
    expect((await nutritionService.current())?.proteinG).toBe(135)
    const templates = await templatesService.list()
    expect(templates.map((t) => t.name)).toEqual(['Upper A', 'Lower A', 'Upper B', 'Lower B'])
    expect(templates.every((t) => t.items.length === 5 && t.items.every((i) => i.exercise))).toBe(
      true,
    )
    const weights = await bodyWeightService.list()
    expect(weights).toHaveLength(1)
    expect(weights[0]).toMatchObject({ weightKg: 75, date: toDateKey(new Date()) })
  })

  it('rehacer el cuestionario reemplaza las rutinas generadas sin duplicar y conserva el historial', async () => {
    await profileService.completeOnboarding(answers)
    await bodyWeightService.log(76, '2026-01-01')
    const manualId = crypto.randomUUID()
    await db.templates.add({
      id: manualId,
      userId: 'local',
      name: 'Mi rutina',
      description: null,
      weekdays: [],
      notes: null,
      position: 99,
      source: 'manual',
      createdAt: '',
      updatedAt: '',
    })
    await profileService.completeOnboarding({ ...answers, trainingDays: [1, 3, 5], weightKg: 74 })

    const names = (await templatesService.list()).map((t) => t.name)
    expect(names).toEqual(
      expect.arrayContaining(['Full Body A', 'Full Body B', 'Full Body C', 'Mi rutina']),
    )
    expect(names).toHaveLength(4)
    const weights = await bodyWeightService.list()
    expect(weights.map((w) => w.weightKg)).toEqual([74, 76]) // hoy actualizado, el viejo intacto
    expect(await db.templateExercises.count()).toBe(15) // 3 rutinas × 5, sin huérfanos
  })

  it('un registro de peso por día y macros manuales con kcal calculadas', async () => {
    await bodyWeightService.log(75.5, '2026-11-20')
    await bodyWeightService.log(75.2, '2026-11-20')
    expect((await bodyWeightService.list()).map((w) => w.weightKg)).toEqual([75.2])

    await nutritionService.setManual({ proteinG: 150, carbsG: 300, fatG: 70 })
    expect(await nutritionService.current()).toMatchObject({ kcal: 2430, source: 'manual' })
  })
})
