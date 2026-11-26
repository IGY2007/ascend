import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { ANSWERS } from '@/test/fixtures'
import { toDateKey } from '@/domain/dates'
import { profileService, templatesService } from './local-data'
import { cardioService, todayEnergy, waterService } from './activity'
import { statsService } from './stats'
import { workoutService } from './workout'

const today = toDateKey(new Date())

async function train(weight: number) {
  const tpl = (await templatesService.list())[0]!
  const id = await workoutService.startFromTemplate(tpl.id)
  const first = (await workoutService.view(id))!.exercises[0]!
  for (const s of first.sets) {
    await workoutService.updateSet(s.id, { weightKg: weight, repetitions: 8 })
    await workoutService.toggleSet(s.id)
  }
  await workoutService.finish(id)
  await new Promise((r) => setTimeout(r, 5))
}

describe('cardio, agua y estadísticas', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await profileService.completeOnboarding(ANSWERS)
  })

  it('el cardio suma calorías al objetivo del día', async () => {
    const base = (await todayEnergy())!.baseKcal
    const kcal = await cardioService.log({
      activity: 'football',
      intensity: 'moderate',
      minutes: 60,
    })
    expect(kcal).toBe(525) // 7 MET × 75 kg × 1 h
    expect(await todayEnergy()).toEqual({ baseKcal: base, cardioKcal: 525, totalKcal: base + 525 })
  })

  it('agua: suma del día, deshacer y objetivo', async () => {
    await waterService.add(250)
    await waterService.add(500)
    await waterService.undoLast()
    expect((await waterService.byDate(today)).map((w) => w.ml)).toEqual([250])
    expect(await waterService.target()).toBe(2750)
    expect((await statsService.waterDaily(today, 1))[0]?.value).toBe(250)
  })

  it('historial de un ejercicio y mejora de fuerza', async () => {
    await train(60)
    await train(70)
    const done = await statsService.exercisesDone()
    expect(done[0]).toMatchObject({ sessions: 2 })
    const points = await statsService.exerciseHistory(done[0]!.exercise.id)
    expect(points.map((p) => p.maxWeight)).toEqual([60, 70])
    const insights = await statsService.insights(today)
    expect(insights.strength).toMatchObject({
      exerciseName: 'Press banca plano con barra',
      pct: 16.7,
    })
    expect(insights.recordsThisWeek).toBe(1)
    expect(insights.weekGoal).toEqual({ done: 2, goal: 4 })
  })
})
