import { beforeEach, describe, expect, it } from 'vitest'
import { db, AscendDB } from '@/lib/db'
import { ANSWERS } from '@/test/fixtures'
import { profileService, templatesService } from './local-data'
import { historyService, workoutService } from './workout'

async function doSets(sessionId: string, weight: number, reps: number) {
  const view = (await workoutService.view(sessionId))!
  const first = view.exercises[0]!
  for (const set of first.sets) {
    await workoutService.updateSet(set.id, { weightKg: weight, repetitions: reps })
    await workoutService.toggleSet(set.id)
  }
  return first
}

describe('entrenamiento', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await profileService.completeOnboarding(ANSWERS)
  })

  it('empezar desde una rutina crea los ejercicios con sus series listas', async () => {
    const tpl = (await templatesService.list())[0]!
    const id = await workoutService.startFromTemplate(tpl.id)
    const view = (await workoutService.view(id))!
    expect(view.name).toBe('Upper A')
    expect(view.exercises).toHaveLength(tpl.items.length)
    expect(view.exercises[0]!.sets).toHaveLength(tpl.items[0]!.targetSets)
    // No se pueden tener dos entrenamientos en curso
    expect(await workoutService.startFromTemplate(tpl.id)).toBe(id)
  })

  it('cerrar y reabrir la app permite retomar la sesión en curso', async () => {
    const tpl = (await templatesService.list())[0]!
    const id = await workoutService.startFromTemplate(tpl.id)
    await doSets(id, 60, 8)
    db.close()
    const reopened = new AscendDB()
    const active = await reopened.sessions.where('status').equals('in_progress').first()
    expect(active?.id).toBe(id)
    expect(
      await reopened.exerciseSets
        .where('sessionId')
        .equals(id)
        .filter((s) => s.isCompleted)
        .count(),
    ).toBe(3)
    reopened.close()
    await db.open()
  })

  it('terminar guarda la duración, limpia lo vacío y arma el resumen', async () => {
    const tpl = (await templatesService.list())[0]!
    const id = await workoutService.startFromTemplate(tpl.id)
    await doSets(id, 60, 8)
    await workoutService.finish(id)
    const summary = (await historyService.summary(id))!
    expect(summary.session.status).toBe('completed')
    expect(summary.session.durationSeconds).toBeGreaterThanOrEqual(0)
    expect(summary).toMatchObject({
      exercises: 1,
      sets: 3,
      volume: 1440,
      records: [],
      comparison: null,
    })
    expect(await workoutService.active()).toBeUndefined()
  })

  it('la segunda vez: precarga el peso anterior, detecta récords y compara', async () => {
    const tpl = (await templatesService.list())[0]!
    const first = await workoutService.startFromTemplate(tpl.id)
    await doSets(first, 60, 8)
    await workoutService.finish(first)

    // Rota a la siguiente rutina
    expect(await workoutService.nextTemplateId()).toBe((await templatesService.list())[1]!.id)

    await new Promise((r) => setTimeout(r, 5))
    const second = await workoutService.startFromTemplate(tpl.id)
    const view = (await workoutService.view(second))!
    expect(view.exercises[0]!.sets[0]!.weightKg).toBe(60)
    expect(view.exercises[0]!.previous.map((s) => s.repetitions)).toEqual([8, 8, 8])
    await doSets(second, 62.5, 8)
    await workoutService.finish(second)

    const summary = (await historyService.summary(second))!
    expect(summary.records).toEqual([
      expect.objectContaining({
        kind: 'weight',
        value: 62.5,
        previous: 60,
        exerciseName: 'Press banca plano con barra',
      }),
    ])
    expect(summary.comparison).toMatchObject({ volumeDiff: 60, volumePct: 4.2 })
    expect((await historyService.list()).map((s) => s.id)).toEqual([second, first])
  })

  it('descartar borra el entrenamiento en curso', async () => {
    const id = await workoutService.startEmpty('Extra')
    await workoutService.discard(id)
    expect(await db.sessions.count()).toBe(0)
  })

  it('los kilos de la rutina se precargan y se actualizan con lo que levantaste', async () => {
    const tpl = (await templatesService.list())[0]!
    const item = tpl.items[0]!
    await templatesService.updateItem(item.id, { targetWeights: [50, 52.5, 55] })
    const id = await workoutService.startFromTemplate(tpl.id)
    const view = (await workoutService.view(id))!
    expect(view.exercises[0]!.sets.map((s) => s.weightKg)).toEqual([50, 52.5, 55])

    // Levanta más en la última serie y termina
    const last = view.exercises[0]!.sets[2]!
    await workoutService.updateSet(last.id, { weightKg: 57.5 })
    for (const s of view.exercises[0]!.sets) {
      await workoutService.updateSet(s.id, { repetitions: 8 })
      await workoutService.toggleSet(s.id)
    }
    await workoutService.finish(id)
    const updated = (await templatesService.list())[0]!.items[0]!
    expect(updated.targetWeights).toEqual([50, 52.5, 57.5])
  })
})
