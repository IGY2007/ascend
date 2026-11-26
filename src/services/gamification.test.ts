import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { ANSWERS } from '@/test/fixtures'
import { profileService, templatesService } from './local-data'
import { workoutService } from './workout'
import { gameState, loadFacts, markAchievementsSeen, seenAchievements } from './gamification'

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
  return id
}

describe('gamificación con datos reales', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    localStorage.clear()
    await profileService.completeOnboarding(ANSWERS)
  })

  it('detecta récords (la primera vez no cuenta) y suma XP', async () => {
    await train(60)
    await train(60) // igual: no es récord
    await train(65) // récord
    const facts = await loadFacts()
    expect(facts.sessions).toHaveLength(3)
    expect(facts.prs).toHaveLength(1)
    const game = await gameState()
    expect(game.level.xp).toBeGreaterThan(0)
    expect(game.achievements.find((a) => a.def.id === 'first_pr')!.unlocked).toBe(true)
    expect(game.muscles.some((m) => m.sets > 0)).toBe(true)
  })

  it('la vista del entrenamiento trae lo mejor de siempre para festejar en vivo', async () => {
    await train(70)
    const tpl = (await templatesService.list())[0]!
    const id = await workoutService.startFromTemplate(tpl.id)
    const view = (await workoutService.view(id))!
    expect(view.exercises[0]!.best.weight).toBe(70)
    expect(view.exercises[1]!.best.weight).toBe(0)
  })

  it('recuerda qué logros ya se festejaron', () => {
    markAchievementsSeen(['first_workout'])
    expect(seenAchievements().has('first_workout')).toBe(true)
  })
})
