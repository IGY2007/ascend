import { Link } from 'react-router'
import { Check, Target } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Skeleton } from '@/components/ui/skeleton'
import { challengeLabel } from '@/features/game/challenge-label'
import { useGameState, useHistory, useLocalProfile } from '@/features/profile/hooks'
import { XP } from '@/domain/gamification'
import { addDays, startOfWeek, toDateKey } from '@/domain/dates'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { formatLongDate, t } from '@/i18n'
import type { Weekday } from '@/types/models'

const h = t.home
const g = t.game

/**
 * Tu semana en una sola tarjeta: el anillo de entrenamientos cumplidos, los 3 desafíos de la
 * semana y los días (tocás uno y ves su reporte).
 */
export function WeekCard({ className }: { className?: string }) {
  const game = useGameState()
  const history = useHistory()
  const profile = useLocalProfile()
  if (!game || history === undefined)
    return <Skeleton className={cn('h-72 rounded-[var(--radius-card)]', className)} />

  const now = new Date()
  const todayKey = toDateKey(now)
  const weekStart = startOfWeek(now)
  const weekStartKey = toDateKey(weekStart)
  const trainedDays = new Set(
    history.map((s) => toDateKey(new Date(s.startedAt))).filter((d) => d >= weekStartKey),
  )
  const goal = profile?.daysPerWeek ?? 0
  const pct = goal ? Math.min(1, trainedDays.size / goal) : 0
  const done = game.challenges.filter((c) => c.done).length

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-baseline justify-between gap-2 px-1">
        <h2 className="font-semibold">{h.thisWeek}</h2>
        <p className="num text-xs text-muted">
          {g.challengesDone(done, game.challenges.length)} · {g.challengesReward(XP.challenge)}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <ProgressRing value={pct} size={96} stroke={9}>
          <div>
            <p className="num text-xl leading-none font-bold">
              {trainedDays.size}/{goal}
            </p>
            <p className="mt-1 text-[0.65rem] text-muted">{h.workoutsShort}</p>
          </div>
        </ProgressRing>

        {/* Desafíos de la semana */}
        <ul className="min-w-0 flex-1 space-y-2.5">
          {game.challenges.map((c) => {
            const fmt = (n: number) => formatDecimal(n, 0)
            return (
              <li key={c.kind}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full border',
                      c.done ? 'border-success bg-success text-bg' : 'border-border-strong',
                    )}
                  >
                    {c.done ? (
                      <Check className="size-3" strokeWidth={3.5} />
                    ) : (
                      <Target className="size-2.5 text-subtle" />
                    )}
                  </span>
                  <p
                    className={cn(
                      'min-w-0 flex-1 truncate text-[0.8rem] leading-tight',
                      c.done ? 'text-muted line-through' : 'text-fg',
                    )}
                  >
                    {challengeLabel(c)}
                  </p>
                  <span className="shrink-0 num text-[0.7rem] text-muted">
                    {fmt(Math.min(c.value, c.target))}/{fmt(c.target)}
                  </span>
                </div>
                <div className="mt-1 ml-7 h-1 overflow-hidden rounded-full bg-card-2">
                  <div
                    className={cn(
                      'h-full origin-left rounded-full transition-transform duration-500',
                      c.done ? 'bg-success' : 'bg-accent',
                    )}
                    style={{ transform: `scaleX(${Math.min(1, c.value / c.target)})` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Días: tocá uno para ver el reporte */}
      <div className="mt-4 grid grid-cols-7 gap-1.5 border-t border-border pt-3">
        {Array.from({ length: 7 }, (_, i) => {
          const date = addDays(weekStart, i)
          const key = toDateKey(date)
          const dow = date.getDay() as Weekday
          const isToday = key === todayKey
          const trained = trainedDays.has(key)
          const future = key > todayKey
          const cell = (
            <>
              <span className="text-[0.7rem] font-medium text-subtle">
                {t.labels.weekdayLetter[dow]}
              </span>
              <span
                className={cn(
                  'grid size-8 place-items-center rounded-full num text-sm font-semibold',
                  trained
                    ? 'bg-success text-bg'
                    : isToday
                      ? 'text-fg ring-1 ring-accent-2'
                      : 'text-muted',
                )}
              >
                {trained ? <Check className="size-4" strokeWidth={3.5} /> : date.getDate()}
              </span>
            </>
          )
          return future ? (
            <span key={key} className="flex flex-col items-center gap-1.5 py-1 opacity-50">
              {cell}
            </span>
          ) : (
            <Link
              key={key}
              to={`/day/${key}`}
              aria-label={t.calendar.openDay(formatLongDate(date))}
              className="flex flex-col items-center gap-1.5 rounded-xl py-1 active:bg-card-2"
            >
              {cell}
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
