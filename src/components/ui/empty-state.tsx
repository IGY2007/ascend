import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Badge } from './badge'
import { t } from '@/i18n'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  comingSoon?: boolean
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  comingSoon,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative flex flex-col items-center overflow-hidden rounded-[var(--radius-card)] border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-56 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative mb-5 grid size-16 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent-2 shadow-[0_0_0_6px_rgb(124_58_237/0.05)]">
        <Icon className="size-7" strokeWidth={1.75} />
      </div>
      {comingSoon && (
        <Badge tone="accent" className="mb-3">
          {t.common.comingSoon}
        </Badge>
      )}
      <h2 className="relative text-lg font-semibold text-fg">{title}</h2>
      <p className="relative mt-2 max-w-sm text-[0.95rem] leading-relaxed text-muted">
        {description}
      </p>
      {action && <div className="relative mt-6">{action}</div>}
    </motion.div>
  )
}
