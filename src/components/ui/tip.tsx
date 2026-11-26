import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Mascot, type MascotMood } from '@/features/avatar/Mascot'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

/**
 * Volt te habla desde un costadito: consejos, datos y comentarios, en un globito de diálogo.
 */
export function Tip({
  children,
  className,
  mood = 'happy',
  bare = false,
}: {
  children: ReactNode
  className?: string
  mood?: MascotMood
  /** Sin la carita de Volt (cuando Volt ya está en pantalla). */
  bare?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn('flex items-end gap-2.5', className)}
    >
      {!bare && <Mascot size={40} mood={mood} className="mb-0.5" />}
      <div className="relative min-w-0 flex-1 rounded-2xl rounded-bl-md border border-accent/25 bg-accent/8 px-4 py-3">
        <p className="text-xs font-semibold text-accent-2">{t.mascot.name}</p>
        <div className="mt-0.5 text-sm leading-relaxed text-muted">{children}</div>
      </div>
    </motion.div>
  )
}
