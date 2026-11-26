import { bodyExtremes, type Body } from '@/domain/avatar'
import { STATS } from '@/domain/gamification'
import { t } from '@/i18n'

const m = t.mascot.body

/** Lo que dice Volt sobre cómo quedó tu personaje este mes. */
export function bodyComment(body: Body, sets: Body): string {
  const total = STATS.reduce((n, s) => n + sets[s], 0)
  if (total === 0) return m.empty
  const avg = STATS.reduce((n, s) => n + body[s], 0) / STATS.length
  const { biggest, smallest, gap } = bodyExtremes(body)
  if (avg < 0.15 && body[biggest] < 0.4) return m.starting
  const upper = ['chest', 'back', 'shoulders', 'arms'].includes(biggest)
  if (gap > 0.35 && upper && (smallest === 'legs' || smallest === 'calves')) return m.skipLegs
  if (gap > 0.35) return m.lagging(t.game.muscles.stats[smallest])
  return avg > 0.6 ? m.tank : m.balanced
}
