import type { ReactNode } from 'react'
import { Lightbulb } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

/** Recomendación breve (cuestionario, sugerencias). */
export function Tip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        'flex gap-3 rounded-2xl border border-accent/25 bg-accent/8 px-4 py-3.5',
        className,
      )}
    >
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent-2" />
      <div className="text-sm leading-relaxed text-muted">
        <span className="font-medium text-accent-2">{t.onboarding.tip}: </span>
        {children}
      </div>
    </motion.div>
  )
}
