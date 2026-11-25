import { Sparkles, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInsights } from '@/features/profile/hooks'
import { toDateKey } from '@/domain/dates'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { insightMessages } from './insight-messages'

/** Mensajes de progreso ("esta semana levantaste X% más…"). `limit` para mostrar solo los primeros. */
export function InsightsCard({ limit, className }: { limit?: number; className?: string }) {
  const data = useInsights(toDateKey(new Date()))
  if (data === undefined)
    return <Skeleton className={cn('h-24 rounded-[var(--radius-card)]', className)} />
  const messages = insightMessages(data).slice(0, limit)

  return (
    <Card className={cn('p-4', className)}>
      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-accent-2">
        <Sparkles className="size-4" />
        {t.insights.title}
      </p>
      {messages.length === 0 ? (
        <p className="text-sm text-muted">{t.insights.empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {messages.map((m, idx) => (
            <motion.li
              key={m.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start gap-2.5 text-[0.95rem] leading-snug"
            >
              <TrendingUp
                className={cn(
                  'mt-0.5 size-4 shrink-0',
                  m.positive ? 'text-success' : 'text-subtle',
                )}
              />
              <span className={m.positive ? 'text-fg' : 'text-muted'}>{m.text}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  )
}
