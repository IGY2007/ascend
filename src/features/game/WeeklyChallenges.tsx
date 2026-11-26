import { Check, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGameState } from '@/features/profile/hooks'
import { XP, type Challenge } from '@/domain/gamification'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const g = t.game

function label(c: Challenge): string {
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

/** Los 3 desafíos de la semana, con su barra de avance. Se renuevan cada lunes. */
export function WeeklyChallenges({ className }: { className?: string }) {
  const game = useGameState()
  if (!game) return <Skeleton className={cn('h-40 rounded-[var(--radius-card)]', className)} />
  const done = game.challenges.filter((c) => c.done).length

  return (
    <Card className={cn('p-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 shrink-0 text-success" />
            {g.challengesTitle}
          </p>
          <p className="mt-0.5 pl-6 text-xs text-success/90">{g.challengesReward(XP.challenge)}</p>
        </div>
        <p className="shrink-0 num text-xs text-muted">
          {g.challengesDone(done, game.challenges.length)}
        </p>
      </div>
      <ul className="space-y-3">
        {game.challenges.map((c) => {
          const pct = Math.min(1, c.value / c.target)
          const fmt = (n: number) => formatDecimal(n, 0)
          return (
            <li key={c.kind} className="flex items-center gap-3">
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border',
                  c.done ? 'border-success bg-success text-bg' : 'border-border-strong',
                )}
              >
                {c.done && <Check className="size-4" strokeWidth={3} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      'truncate text-sm',
                      c.done ? 'text-muted line-through' : 'text-fg',
                    )}
                  >
                    {label(c)}
                  </p>
                  <p className="shrink-0 num text-xs text-muted">
                    {g.challengeProgress(fmt(Math.min(c.value, c.target)), fmt(c.target))}
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-card-2">
                  <div
                    className={cn(
                      'h-full origin-left rounded-full transition-transform duration-500',
                      c.done ? 'bg-success' : 'bg-accent',
                    )}
                    style={{ transform: `scaleX(${pct})` }}
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
