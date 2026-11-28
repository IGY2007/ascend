import { Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tip } from '@/components/ui/tip'
import { useGameState, useLocalProfile } from '@/features/profile/hooks'
import { laggingStat, type Readiness } from '@/domain/gamification'
import { Link } from 'react-router'
import { Pencil } from 'lucide-react'
import { useAvatar } from '@/features/profile/hooks'
import { AvatarFigure } from '@/features/avatar/AvatarFigure'
import { bodyComment } from '@/features/avatar/body-comment'
import { cn } from '@/lib/utils'
import { formatMonthYear, t } from '@/i18n'

const m = t.game.muscles

const READY_STYLE: Record<Readiness, string> = {
  ready: 'bg-gold/15 text-success',
  recovering: 'bg-accent/15 text-accent-2',
  cold: 'bg-warning/12 text-warning',
  untrained: 'bg-card-2 text-subtle',
}

/**
 * La ficha del físico: tu personaje del mes, cuánto creció cada grupo muscular y si está listo
 * para volver a entrenarse. Un solo nivel en toda la app (el del viaje): acá no hay niveles por músculo.
 */
export function PhysiqueTab() {
  const game = useGameState()
  const avatar = useAvatar()
  const heightCm = useLocalProfile()?.heightCm
  if (!game || !avatar) return <Skeleton className="h-96 rounded-[var(--radius-card)]" />
  const stats = game.muscles
  const lagging = laggingStat(stats)
  const month = formatMonthYear(new Date()).split(' ')[0]!

  return (
    <>
      <Card highlight className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xl font-bold first-letter:uppercase">{t.avatar.monthBody(month)}</p>
            <p className="mt-0.5 text-xs text-muted">{t.avatar.resetHint}</p>
          </div>
          <Link
            to="/avatar"
            aria-label={t.avatar.edit}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-muted hover:text-fg"
          >
            <Pencil className="size-4" />
          </Link>
        </div>
        <AvatarFigure
          heightCm={heightCm}
          avatar={avatar}
          body={game.monthBody}
          jerseyNumber={game.level.level}
          className="mx-auto mt-2 h-80 w-auto"
          title={t.avatar.title}
        />
      </Card>

      <Tip className="mt-4" mood={lagging ? 'wow' : 'happy'}>
        {bodyComment(game.monthBody, game.monthSets)}
      </Tip>

      <ul className="mt-5 space-y-2.5">
        {stats.map((s) => {
          return (
            <li key={s.stat}>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{m.stats[s.stat]}</p>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[0.7rem] font-semibold',
                          READY_STYLE[s.readiness],
                        )}
                      >
                        {m.readiness[s.readiness]}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-card-2">
                      <div
                        className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-gold transition-transform duration-700"
                        style={{ transform: `scaleX(${Math.max(0.02, game.monthBody[s.stat])})` }}
                      />
                    </div>
                    <p className="mt-1.5 num text-xs text-muted">
                      {t.avatar.monthSets(game.monthSets[s.stat])}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 flex gap-2 px-1 text-xs leading-relaxed text-subtle">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {m.weeklyTarget} {m.readyHint}
        </span>
      </p>
    </>
  )
}
