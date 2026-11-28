import { useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGameState } from '@/features/profile/hooks'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { ACHIEVEMENT_ICONS } from './icons'

const g = t.game

/** Todos los logros: los desbloqueados en verde, el resto con su avance. */
export function AchievementsGrid() {
  const game = useGameState()
  const [all, setAll] = useState(false)
  if (!game) return <Skeleton className="h-64 rounded-[var(--radius-card)]" />
  const list = [...game.achievements].sort(
    (a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress - a.progress,
  )
  const unlocked = list.filter((a) => a.unlocked).length

  return (
    <div>
      <p className="mb-3 px-1 num text-xs text-muted">
        {g.achievementsCount(unlocked, list.length)}
      </p>
      <ul className="grid grid-cols-3 gap-2.5">
        {(all ? list : list.slice(0, 6)).map((a) => {
          const Icon = ACHIEVEMENT_ICONS[a.def.icon]
          const text = g.achievements[a.def.id]
          return (
            <li
              key={a.def.id}
              className={cn(
                'flex flex-col items-center rounded-2xl border p-3 text-center',
                a.unlocked ? 'border-gold/40 bg-gold/8' : 'border-border bg-card',
              )}
            >
              <span
                className={cn(
                  'relative grid size-11 place-items-center rounded-full',
                  a.unlocked ? 'bg-gold text-gold-fg' : 'bg-card-2 text-subtle',
                )}
              >
                <Icon className="size-5" />
                {!a.unlocked && (
                  <Lock className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full bg-card p-0.5 text-muted" />
                )}
              </span>
              <p
                className={cn(
                  'mt-2 line-clamp-2 text-xs leading-tight font-semibold',
                  a.unlocked ? 'text-fg' : 'text-muted',
                )}
              >
                {text?.title}
              </p>
              <p className="mt-1 line-clamp-2 text-[0.65rem] leading-tight text-subtle">
                {text?.desc}
              </p>
              {!a.unlocked && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-card-2">
                  <div
                    className="h-full origin-left rounded-full bg-accent"
                    style={{ transform: `scaleX(${a.progress})` }}
                  />
                </div>
              )}
              {!a.unlocked && a.def.target > 1 && (
                <p className="mt-1 num text-[0.6rem] text-subtle">
                  {formatDecimal(Math.min(a.value, a.def.target), 0)}/
                  {formatDecimal(a.def.target, 0)}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      {!all && list.length > 6 && (
        <Button variant="ghost" block size="sm" className="mt-2" onClick={() => setAll(true)}>
          <ChevronDown />
          {g.seeAll(list.length)}
        </Button>
      )}
    </div>
  )
}
