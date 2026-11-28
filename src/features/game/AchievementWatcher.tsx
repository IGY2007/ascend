import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Confetti } from '@/components/ui/confetti'
import { useGameState } from '@/features/profile/hooks'
import { markAchievementsSeen, seenAchievements } from '@/services/gamification'
import { t } from '@/i18n'
import { ACHIEVEMENT_ICONS } from './icons'
import type { AchievementState } from '@/domain/gamification'

const g = t.game

/**
 * Festeja los logros nuevos (venga de donde venga: entrenar, agua, cardio, peso) con confeti y un
 * cartel. Cada logro se festeja una sola vez.
 */
export function AchievementWatcher() {
  const game = useGameState()
  // Lo ya festejado al abrir la app; lo que se desbloquee después aparece en la cola.
  const [seenAtStart] = useState(() => seenAchievements())
  const [dismissed, setDismissed] = useState<string[]>([])
  const queue: AchievementState[] = (game?.achievements ?? []).filter(
    (a) => a.unlocked && !seenAtStart.has(a.def.id) && !dismissed.includes(a.def.id),
  )
  const current = queue[0]
  const ids = queue.map((a) => a.def.id).join(',')

  // Se marcan como vistos apenas aparecen: cada logro se festeja una sola vez.
  useEffect(() => {
    if (ids) markAchievementsSeen(ids.split(','))
  }, [ids])

  useEffect(() => {
    if (!current) return
    const id = window.setTimeout(() => setDismissed((d) => [...d, current.def.id]), 3400)
    return () => window.clearTimeout(id)
  }, [current])

  const Icon = current ? ACHIEVEMENT_ICONS[current.def.icon] : null
  const text = current ? g.achievements[current.def.id] : null

  return (
    <>
      {current && <Confetti burstKey={current.def.id} />}
      <AnimatePresence>
        {current && Icon && (
          <motion.button
            type="button"
            key={current.def.id}
            onClick={() => setDismissed((d) => [...d, current.def.id])}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[70] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-gold/40 bg-card-2/95 px-4 py-3 text-left shadow-[0_12px_40px_-12px_rgb(250_204_21/0.45)] backdrop-blur"
            role="status"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-gold-fg">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold tracking-wide text-success uppercase">
                {g.newAchievements}
              </span>
              <span className="block truncate font-semibold">{text?.title}</span>
              <span className="block truncate text-xs text-muted">{text?.desc}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
