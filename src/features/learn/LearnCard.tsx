import { useState } from 'react'
import { Lightbulb, RefreshCw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const facts = t.learn.facts

/** Un dato corto por día para aprender mientras usás la app. Se puede pasar al siguiente. */
export function LearnCard({ className }: { className?: string }) {
  const [index, setIndex] = useState(() => {
    const now = new Date()
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000,
    )
    return dayOfYear % facts.length
  })

  return (
    <div
      className={cn(
        'flex gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4',
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success/12 text-success">
        <Lightbulb className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wide text-success uppercase">
          {t.learn.title}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-1 text-sm leading-relaxed text-muted"
          >
            {facts[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % facts.length)}
        aria-label={t.learn.next}
        className="-mt-1 -mr-1 grid size-11 shrink-0 place-items-center rounded-xl text-subtle hover:text-fg"
      >
        <RefreshCw className="size-4" />
      </button>
    </div>
  )
}
