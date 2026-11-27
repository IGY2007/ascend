import { Flame, Moon, Shield } from 'lucide-react'
import type { StreakInfo } from '@/domain/gamification'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const st = t.streak

/**
 * La racha diaria: llama si entrenaste hoy, lunita si es día de descanso. Los escuditos son los
 * protectores guardados.
 */
export function StreakBadge({ streak, className }: { streak: StreakInfo; className?: string }) {
  const on = streak.current > 0
  const resting = on && !streak.trainedToday
  const Icon = resting ? Moon : Flame
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
        !on && 'bg-card-2 text-muted',
        on && !resting && 'bg-warning/15 text-warning',
        resting && 'bg-accent/15 text-accent-2',
        className,
      )}
      aria-label={`${st.title}: ${st.days(streak.current)}${resting ? ` · ${st.rest}` : ''}`}
    >
      <Icon className={cn('size-3.5', on && 'fill-current')} />
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
