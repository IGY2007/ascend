import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { ANSWERS } from '@/test/fixtures'
import { addDays, toDateKey } from '@/domain/dates'
import { nutritionService, profileService, templatesService } from './local-data'
import { cardioService, todayEnergy, waterService } from './activity'
import { historyService, workoutService } from './workout'
import { calendarService, monthGrid } from './calendar'

const today = toDateKey(new Date())
const threeDaysAgo = toDateKey(addDays(new Date(), -3))

describe('calendario y edición de días anteriores', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await profileService.completeOnboarding(ANSWERS)
  })

  it('cargar un entrenamiento de un día anterior y guardar solo las series marcadas', async () => {
    const tpl = (await templatesService.list())[0]!
    const id = await workoutService.logPast(threeDaysAgo, tpl.id)
    const view = (await workoutService.view(id))!
    expect(view.status).toBe('completed')
    expect(toDateKey(new Date(view.startedAt))).toBe(threeDaysAgo)
    expect(view.exercises).toHaveLength(tpl.items.length)

    // Marca 2 series del primer ejercicio, nada más.
    const [a, b] = view.exercises[0]!.sets
    await workoutService.toggleSet(a!.id, { weightKg: 60, repetitions: 8 })
    await workoutService.toggleSet(b!.id, { weightKg: 60, repetitions: 8 })
    expect(await workoutService.saveEdits(id, { durationMinutes: 50 })).toBe('saved')

    const saved = (await workoutService.view(id))!
    expect(saved.exercises).toHaveLength(1)
    expect(saved.exercises[0]!.sets).toHaveLength(2)
    expect(saved.durationSeconds).toBe(50 * 60)
    expect(await historyService.byDate(threeDaysAgo)).toHaveLength(1)
    // No es el entrenamiento en curso
    expect(await workoutService.active()).toBeUndefined()
  })

  it('mover un entrenamiento de día y borrarlo si queda vacío', async () => {
    const id = await workoutService.logPast(threeDaysAgo, null)
    const ex = (await db.exercises.toArray())[0]
    const library = ex?.id ?? (await import('@/data/global-exercises')).GLOBAL_EXERCISES[0]!.id
    await workoutService.addExercise(id, library)
    const set = (await workoutService.view(id))!.exercises[0]!.sets[0]!
    await workoutService.toggleSet(set.id, { weightKg: 40, repetitions: 10 })
    await workoutService.saveEdits(id, { date: today })
    expect(await historyService.byDate(today)).toHaveLength(1)
    expect(await historyService.byDate(threeDaysAgo)).toHaveLength(0)

    await workoutService.toggleSet(set.id)
    await workoutService.updateSet(set.id, { repetitions: null })
    // Sin series: no se borra a escondidas…
    expect(await workoutService.saveEdits(id)).toBe('empty')
    expect(await db.sessions.get(id)).toBeDefined()
    // …salvo que sea uno recién cargado y se vaya sin cargar nada
    expect(await workoutService.saveEdits(id, {}, { discardIfEmpty: true })).toBe('deleted')
    expect(await db.sessions.get(id)).toBeUndefined()
  })

  it('cargar reps sin tocar el tilde cuenta, y "lo hice como en la rutina" completa todo', async () => {
    const tpl = (await templatesService.list())[0]!
    const id = await workoutService.logPast(threeDaysAgo, tpl.id)
    const set = (await workoutService.view(id))!.exercises[0]!.sets[0]!
    await workoutService.updateSet(set.id, { weightKg: 50, repetitions: 8 }) // sin tilde
    expect(await workoutService.saveEdits(id)).toBe('saved')
    expect((await workoutService.view(id))!.exercises[0]!.sets[0]!.isCompleted).toBe(true)

    const id2 = await workoutService.logPast(threeDaysAgo, tpl.id)
    await workoutService.completeAll(id2)
    const v = (await workoutService.view(id2))!
    expect(
      v.exercises.every((e) =>
        e.sets.every((x) => x.isCompleted && (x.repetitions ?? x.durationSeconds ?? 0) > 0),
      ),
    ).toBe(true)
  })

  it('corregir el agua y el cardio de un día anterior', async () => {
    await waterService.add(500, threeDaysAgo)
    await waterService.add(500, threeDaysAgo)
    await waterService.setTotal(threeDaysAgo, 1750)
    const logs = await waterService.byDate(threeDaysAgo)
    expect(logs.reduce((s, w) => s + w.ml, 0)).toBe(1750)
    await waterService.setTotal(threeDaysAgo, 0)
    expect(await waterService.byDate(threeDaysAgo)).toHaveLength(0)

    const kcal = await cardioService.log({
      activity: 'football',
      intensity: 'moderate',
      minutes: 60,
      date: threeDaysAgo,
    })
    const energy = (await todayEnergy(threeDaysAgo))!
    expect(energy.cardioKcal).toBe(kcal)
    expect((await todayEnergy(today))!.cardioKcal).toBe(0)
  })

  it('el calendario resume cada día', async () => {
    const id = await workoutService.logPast(threeDaysAgo, (await templatesService.list())[0]!.id)
    const set = (await workoutService.view(id))!.exercises[0]!.sets[0]!
    await workoutService.toggleSet(set.id, { weightKg: 50, repetitions: 8 })
    await workoutService.saveEdits(id)
    await cardioService.log({ activity: 'cycling', intensity: 'light', minutes: 30, date: today })
    await waterService.add(await waterService.target(), today)

    const days = await calendarService.range(threeDaysAgo, today)
    expect(days.get(threeDaysAgo)?.workouts).toBe(1)
    expect(days.get(today)?.cardioMinutes).toBe(30)
    expect(days.get(today)?.waterGoalMet).toBe(true)
  })

  it('la grilla del mes arranca el lunes y cubre semanas completas', () => {
    const cells = monthGrid(2026, 10) // noviembre 2026: empieza domingo
    expect(cells.length % 7).toBe(0)
    expect(cells[0]!.date).toBe('2026-10-26')
    expect(cells.find((c) => c.inMonth)!.date).toBe('2026-11-01')
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30)
  })

  it('el objetivo de un día anterior es el que regía ese día', async () => {
    const before = (await nutritionService.current())!
    await nutritionService.setManual({ proteinG: 200, carbsG: 300, fatG: 80 })
    expect((await nutritionService.at(today))!.proteinG).toBe(200)
    // Antes del primer objetivo cae al vigente; el del cuestionario sigue disponible por fecha
    expect((await nutritionService.at('2000-01-01'))!.id).toBeDefined()
    expect(before.source).toBe('questionnaire')
  })
})
