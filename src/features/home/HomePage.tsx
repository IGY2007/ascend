import { useState } from 'react'
import { Link } from 'react-router'
import { Check, ChevronRight, Play, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { MacroTiles } from '@/features/nutrition/MacroTiles'
import { LogWeightSheet } from '@/features/body/LogWeightSheet'
import { ActiveWorkoutBanner } from '@/features/workout/ActiveWorkoutBanner'
import { useStartWorkout } from '@/features/workout/use-start-workout'
import {
  useActiveSession,
  useBodyWeights,
  useHistory,
  useLocalProfile,
  useNextTemplateId,
  useNutritionGoal,
  useTemplates,
} from '@/features/profile/hooks'
import { useDisplayName } from '@/features/profile/use-profile'
import { weightStats } from '@/domain/body-weight'
import { addDays, startOfWeek, toDateKey } from '@/domain/dates'
import { formatDecimal, formatSigned } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { formatLongDate, t } from '@/i18n'
import type { Weekday } from '@/types/models'

const h = t.home

export function HomePage() {
  const name = useDisplayName()
  const profile = useLocalProfile()
  const templates = useTemplates()
  const nextId = useNextTemplateId()
  const active = useActiveSession()
  const history = useHistory()
  const goal = useNutritionGoal()
  const weights = useBodyWeights()
  const start = useStartWorkout()
  const [logOpen, setLogOpen] = useState(false)

  const now = new Date()
  const todayKey = toDateKey(now)
  const weekStart = startOfWeek(now)
  const weekStartKey = toDateKey(weekStart)

  const next = templates?.find((x) => x.id === nextId)
  const thisWeek = (history ?? []).filter((s) => toDateKey(new Date(s.startedAt)) >= weekStartKey)
  const trainedDays = new Set(thisWeek.map((s) => toDateKey(new Date(s.startedAt))))
  const weekGoal = profile?.daysPerWeek ?? 0
  const trainedToday = trainedDays.has(todayKey)
  const stats = weights ? weightStats(weights, todayKey, profile?.targetWeightKg ?? null) : null

  return (
    <>
      <header className="mb-6">
        <p className="text-sm font-medium text-muted first-letter:uppercase">
          {formatLongDate(now)}
        </p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight">
          {h.greeting(name)}
        </h1>
      </header>

      <ActiveWorkoutBanner />

      {/* Lo que toca en la rotación */}
      {templates === undefined ? (
        <Skeleton className="h-36 rounded-[var(--radius-card)]" />
      ) : next && !active ? (
        <Card highlight>
          <Link to={`/workouts/${next.id}`} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-accent-2">
                {trainedToday ? h.trainedToday : h.upNext}
              </p>
              <p className="mt-1 truncate text-2xl font-bold tracking-tight">{next.name}</p>
              <p className="mt-1 num text-sm text-muted">
                {h.exercises(next.items.length)}
                {profile && ` · ${h.approxMinutes(profile.sessionMinutes)}`}
              </p>
            </div>
            <ChevronRight className="size-6 shrink-0 text-muted" />
          </Link>
          <Button size="lg" block className="mt-4" onClick={() => void start(next.id)}>
            <Play />
            {h.startWorkout}
          </Button>
        </Card>
      ) : null}

      {/* Semana: días entrenados de verdad */}
      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="text-sm font-medium text-muted">{h.thisWeek}</h2>
          {weekGoal > 0 && (
            <p
              className={cn(
                'num text-xs',
                thisWeek.length >= weekGoal ? 'text-success' : 'text-subtle',
              )}
            >
              {thisWeek.length >= weekGoal ? h.weekDone : h.weekProgress(thisWeek.length, weekGoal)}
            </p>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const date = addDays(weekStart, i)
            const key = toDateKey(date)
            const dow = date.getDay() as Weekday
            const isToday = key === todayKey
            const trained = trainedDays.has(key)
            return (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border py-2.5',
                  isToday ? 'border-accent/60 bg-accent/10' : 'border-transparent',
                )}
              >
                <span className="text-[0.7rem] font-medium text-subtle">
                  {t.labels.weekdayLetter[dow]}
                </span>
                <span
                  className={cn('num text-sm font-semibold', isToday ? 'text-fg' : 'text-muted')}
                >
                  {date.getDate()}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'grid size-4 place-items-center rounded-full',
                    trained
                      ? 'bg-success text-bg'
                      : key < todayKey
                        ? 'bg-card-2'
                        : 'bg-transparent',
                  )}
                >
                  {trained && <Check className="size-2.5" strokeWidth={4} />}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Nutrición */}
      {goal && (
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-sm font-medium text-muted">{h.nutrition}</h2>
          <Card>
            <p className="flex items-baseline gap-1.5">
              <AnimatedNumber value={goal.kcal} className="text-3xl font-bold" />
              <span className="text-sm text-muted">
                {t.units.kcal} · {h.nutritionTarget}
              </span>
            </p>
            <MacroTiles macros={goal} className="mt-4" />
          </Card>
        </section>
      )}

      {/* Peso */}
      <section className="mt-6">
        <h2 className="mb-3 px-1 text-sm font-medium text-muted">{h.weight}</h2>
        <Card>
          <div className="flex items-start justify-between gap-4">
            {stats?.latest ? (
              <p className="flex items-baseline gap-1.5">
                <AnimatedNumber
                  value={stats.latest.weightKg}
                  format={(v) => formatDecimal(v, 1)}
                  className="text-3xl font-bold"
                />
                <span className="text-sm text-muted">{t.units.kg}</span>
              </p>
            ) : (
              <p className="text-sm text-muted">{h.noWeight}</p>
            )}
            <Button size="sm" variant="secondary" onClick={() => setLogOpen(true)}>
              <Plus />
              {h.logWeight}
            </Button>
          </div>
          {stats?.weekChange != null && stats.weekChange !== 0 && (
            <p className="mt-2 flex items-center gap-1.5 num text-sm text-muted">
              {stats.weekChange > 0 ? (
                <TrendingUp className="size-4 shrink-0" />
              ) : (
                <TrendingDown className="size-4 shrink-0" />
              )}
              {formatSigned(stats.weekChange, 1)} {t.units.kg} {t.progress.weekChange}
            </p>
          )}
          {stats?.toTarget != null && (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted">
              {Math.abs(stats.toTarget) < 0.1
                ? h.targetReached
                : h.toTarget(formatDecimal(Math.abs(stats.toTarget), 1))}
            </p>
          )}
        </Card>
      </section>

      <LogWeightSheet
        open={logOpen}
        onOpenChange={setLogOpen}
        initial={stats?.latest?.weightKg ?? null}
      />
    </>
  )
}
