import type { Challenge } from '@/domain/gamification'
import { t } from '@/i18n'

const g = t.game

/** Texto del desafío en el idioma activo. */
export function challengeLabel(c: Challenge): string {
  switch (c.kind) {
    case 'train_days':
    case 'water_days':
    case 'cardio_minutes':
    case 'sets':
    case 'weigh_ins':
      return g.challenge[c.kind](c.target)
    case 'record':
    case 'beat_volume':
      return g.challenge[c.kind]()
  }
}
