import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Moon, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { MacroTiles } from '@/features/nutrition/MacroTiles'
import { LogWeightSheet } from '@/features/body/LogWeightSheet'
import {
  useBodyWeights,
  useLocalProfile,
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
  const goal = useNutritionGoal()
  const weights = useBodyWeights()
  const [logOpen, setLogOpen] = useState(false)

  const now = new Date()
  const todayKey = toDateKey(now)
  const todayDow = now.getDay() as Weekday

  const todayTemplate = templates?.find((tpl) => tpl.weekdays.includes(todayDow))
  const nextTemplate = useMemo(() => {
    if (!templates || todayTemplate) return null
    for (let i = 1; i <= 7; i++) {
      const dow = addDays(now, i).getDay() as Weekday
      const tpl = templates.find((x) => x.weekdays.includes(dow))
      if (tpl) return { tpl, dow }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, todayTemplate, todayKey])

  const trainingDays = new Set(templates?.flatMap((x) => x.weekdays) ?? [])
  const weekStart = startOfWeek(now)
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

      {/* Hoy */}
      {templates === undefined ? (
        <Skeleton className="h-32 rounded-[var(--radius-card)]" />
      ) : todayTemplate ? (
        <Link
          to={`/workouts/${todayTemplate.id}`}
          className="block transition-transform active:scale-[0.99]"
        >
          <Card highlight className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-accent-2">{h.today}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{todayTemplate.name}</p>
              <p className="mt-1 truncate text-sm text-muted">{todayTemplate.description}</p>
              <p className="mt-3 num text-sm text-muted">
                {h.exercises(todayTemplate.items.length)}
                {profile && ` · ${h.approxMinutes(profile.sessionMinutes)}`}
              </p>
            </div>
            <ChevronRight className="size-6 shrink-0 text-muted" />
          </Card>
        </Link>
      ) : (
        <Card className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-card-2 text-muted">
            <Moon className="size-6" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{h.restDay}</p>
            <p className="mt-0.5 text-sm text-muted">
              {nextTemplate
                ? h.nextUp(nextTemplate.tpl.name, t.labels.weekdayLong[nextTemplate.dow])
                : h.noPlan}
            </p>
          </div>
        </Card>
      )}

      {/* Semana */}
      <section className="mt-6">
        <h2 className="mb-3 px-1 text-sm font-medium text-muted">{h.thisWeek}</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const date = addDays(weekStart, i)
            const dow = date.getDay() as Weekday
            const isToday = toDateKey(date) === todayKey
            const training = trainingDays.has(dow)
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
                    'size-1.5 rounded-full',
                    training ? 'bg-accent-2' : 'bg-transparent',
                  )}
                />
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
            <div className="min-w-0">
              {stats?.latest ? (
                <>
                  <p className="flex items-baseline gap-1.5">
                    <AnimatedNumber
                      value={stats.latest.weightKg}
                      format={(v) => formatDecimal(v, 1)}
                      className="text-3xl font-bold"
                    />
                    <span className="text-sm text-muted">{t.units.kg}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">{h.noWeight}</p>
              )}
            </div>
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
