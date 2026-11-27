import { Flame, Shield } from 'lucide-react'
import type { StreakInfo } from '@/domain/gamification'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const st = t.streak

/** La llama de la racha semanal, con los protectores que tenés guardados. */
export function StreakBadge({ streak, className }: { streak: StreakInfo; className?: string }) {
  const on = streak.current > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
        on ? 'bg-warning/15 text-warning' : 'bg-card-2 text-muted',
        className,
      )}
      aria-label={`${st.title}: ${st.weeks(streak.current)}`}
    >
      <Flame className={cn('size-3.5', on && 'fill-current')} />
      <span className="num">{st.short(streak.current)}</span>
      {streak.freezes > 0 && (
        <span
          className="ml-0.5 flex items-center gap-0.5 text-accent-2"
          aria-label={st.freezes(streak.freezes)}
        >
          <Shield className="size-3 fill-current" />
          {streak.freezes}
        </span>
      )}
    </span>
  )
}
