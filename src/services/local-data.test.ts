import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { toDateKey } from '@/domain/dates'
import { ANSWERS } from '@/test/fixtures'
import { GLOBAL_EXERCISES } from '@/data/global-exercises'
import {
  bodyWeightService,
  exercisesService,
  nutritionService,
  profileService,
  templatesService,
} from './local-data'

describe('datos locales', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('el cuestionario prepara perfil, macros, rutinas en rotación y peso inicial', async () => {
    await profileService.completeOnboarding(ANSWERS)
    expect((await profileService.get())?.name).toBe('Julian')
    expect((await nutritionService.current())?.proteinG).toBe(150)
    const templates = await templatesService.list()
    expect(templates.map((t) => t.name)).toEqual(['Upper A', 'Lower A', 'Upper B', 'Lower B'])
    expect(
      templates.every((t) => t.weekdays.length === 0 && t.items.every((i) => i.exercise)),
    ).toBe(true)
    expect(await bodyWeightService.list()).toMatchObject([
      { weightKg: 75, date: toDateKey(new Date()) },
    ])
  })

  it('rehacer el cuestionario reemplaza solo las rutinas generadas y conserva el historial', async () => {
    await profileService.completeOnboarding(ANSWERS)
    await bodyWeightService.log(76, '2026-01-01')
    const manualId = await templatesService.create('My Workout')
    await profileService.completeOnboarding({
      ...ANSWERS,
      split: 'classic',
      daysPerWeek: 3,
      weightKg: 74,
    })
    const list = await templatesService.list()
    expect(list.map((t) => t.name)).toEqual([
      'Chest & Triceps',
      'Back & Biceps',
      'Legs & Shoulders',
      'My Workout',
    ])
    expect(list.at(-1)?.id).toBe(manualId)
    expect((await bodyWeightService.list()).map((w) => w.weightKg)).toEqual([74, 76])
  })

  it('registrar peso recalcula los macros, salvo que estén editados a mano', async () => {
    await profileService.completeOnboarding(ANSWERS)
    await bodyWeightService.log(80)
    expect((await nutritionService.current())?.proteinG).toBe(160) // 80 × 2.0 = 160
    await nutritionService.setManual({ proteinG: 150, carbsG: 300, fatG: 70 })
    await bodyWeightService.log(82)
    expect(await nutritionService.current()).toMatchObject({ kcal: 2430, source: 'manual' })
  })

  it('un registro de peso por día; un registro viejo no recalcula', async () => {
    await profileService.completeOnboarding(ANSWERS)
    const before = await nutritionService.current()
    await bodyWeightService.log(90, '2020-01-01')
    expect((await nutritionService.current())?.id).toBe(before?.id)
    await bodyWeightService.log(75.2)
    await bodyWeightService.log(75.4)
    expect(
      (await bodyWeightService.list()).filter((w) => w.date === toDateKey(new Date())),
    ).toHaveLength(1)
  })

  it('editar rutinas: crear, agregar, mover, cambiar y quitar ejercicios', async () => {
    const id = await templatesService.create('Push Day')
    const [a, b] = GLOBAL_EXERCISES
    await templatesService.addExercise(id, a!.id)
    await templatesService.addExercise(id, b!.id)
    let tpl = (await templatesService.list())[0]!
    await templatesService.moveItem(tpl.items[1]!.id, -1)
    tpl = (await templatesService.list())[0]!
    expect(tpl.items.map((i) => i.exerciseId)).toEqual([b!.id, a!.id])
    await templatesService.updateItem(tpl.items[0]!.id, {
      targetSets: 5,
      targetRepsMin: 5,
      targetRepsMax: 5,
    })
    await templatesService.removeItem(tpl.items[1]!.id)
    tpl = (await templatesService.list())[0]!
    expect(tpl.items).toHaveLength(1)
    expect(tpl.items[0]).toMatchObject({ targetSets: 5, position: 0 })
    await templatesService.update(id, { name: 'Chest Day' })
    expect((await templatesService.list())[0]?.name).toBe('Chest Day')
  })

  it('ejercicios propios aparecen en la biblioteca y se pueden renombrar', async () => {
    const ex = await exercisesService.createCustom({
      name: 'Smith Incline Press',
      primaryMuscle: 'chest',
      equipment: 'smith',
      exerciseType: 'weighted',
    })
    await exercisesService.updateCustom(ex.id, { name: 'Smith Incline' })
    const all = await exercisesService.all()
    expect(all[0]?.name).toBe('Smith Incline')
    expect(all).toHaveLength(GLOBAL_EXERCISES.length + 1)
  })
})
