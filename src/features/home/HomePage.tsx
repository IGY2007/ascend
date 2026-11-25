import { useState } from 'react'
import { Link } from 'react-router'
import {
  Check,
  ChevronRight,
  Droplet,
  Dumbbell,
  Play,
  Plus,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { ProgressRing } from '@/components/ui/progress-ring'
import { LearnCard } from '@/features/learn/LearnCard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { MacroTiles } from '@/features/nutrition/MacroTiles'
import { LogWeightSheet } from '@/features/body/LogWeightSheet'
import { ActiveWorkoutBanner } from '@/features/workout/ActiveWorkoutBanner'
import { InsightsCard } from '@/features/progress/InsightsCard'
import { WaterCard } from '@/features/activity/WaterCard'
import { CardioSheet } from '@/features/activity/CardioSheet'
import { useStartWorkout } from '@/features/workout/use-start-workout'
import {
  useActiveSession,
  useBodyWeights,
  useHistory,
  useLocalProfile,
  useNextTemplateId,
  useNutritionGoal,
  useTemplates,
  useTodayCardio,
  useTodayEnergy,
  useTodayWater,
  useWaterTarget,
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
  const [cardioOpen, setCardioOpen] = useState(false)

  const now = new Date()
  const todayKey = toDateKey(now)
  const weekStart = startOfWeek(now)
  const weekStartKey = toDateKey(weekStart)

  const next = templates?.find((x) => x.id === nextId)
  const thisWeek = (history ?? []).filter((s) => toDateKey(new Date(s.startedAt)) >= weekStartKey)
  const trainedDays = new Set(thisWeek.map((s) => toDateKey(new Date(s.startedAt))))
  const weekGoal = profile?.daysPerWeek ?? 0
  const trainedToday = trainedDays.has(todayKey)
  const energy = useTodayEnergy(todayKey)
  const cardioToday = useTodayCardio(todayKey)
  const waterToday = useTodayWater(todayKey)
  const waterTarget = useWaterTarget()
  const cardioMinutes = (cardioToday ?? []).reduce((n, c) => n + c.minutes, 0)
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

      {/* Tu semana: anillo de progreso (violeta → verde) + hoy */}
      <section className="mt-6">
        <h2 className="mb-3 px-1 text-sm font-medium text-muted">{h.thisWeek}</h2>
        <Card>
          <div className="flex items-center gap-5">
            <ProgressRing value={weekGoal ? thisWeek.length / weekGoal : 0}>
              <div>
                <p className="num text-2xl leading-none font-bold">
                  {weekGoal ? Math.min(100, Math.round((thisWeek.length / weekGoal) * 100)) : 0}%
                </p>
                <p className="mt-1 text-[0.7rem] text-muted">{h.completed}</p>
              </div>
            </ProgressRing>
            <ul className="min-w-0 flex-1 space-y-3">
              <Stat
                icon={Dumbbell}
                label={h.ringWorkout}
                value={`${thisWeek.length} / ${weekGoal}`}
                done={weekGoal > 0 && thisWeek.length >= weekGoal}
              />
              <Stat
                icon={Droplet}
                label={h.ringWater}
                value={`${formatDecimal((waterToday ?? 0) / 1000, 2)} / ${formatDecimal((waterTarget ?? 0) / 1000, 2)} L`}
                done={!!waterTarget && (waterToday ?? 0) >= waterTarget}
              />
              <Stat
                icon={Zap}
                label={h.ringCardio}
                value={`${cardioMinutes} ${t.charts.min}`}
                done={cardioMinutes > 0}
              />
            </ul>
          </div>

          {/* Días de la semana: tocá uno para ver el reporte del día */}
          <div className="mt-5 grid grid-cols-7 gap-1.5 border-t border-border pt-4">
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
      </section>

      <LearnCard className="mt-6" />

      <InsightsCard limit={2} className="mt-6" />

      {/* Actividad de hoy: cardio */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-sm font-medium text-muted">{t.cardio.today}</h2>
          <Button
            size="sm"
            variant="ghost"
            className="-mr-2 h-9"
            onClick={() => setCardioOpen(true)}
          >
            <Plus />
            {t.cardio.add}
          </Button>
        </div>
        {cardioToday && cardioToday.length > 0 && (
          <Card className="mb-3 divide-y divide-border py-1">
            {cardioToday.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 py-2.5 text-[0.95rem]"
              >
                <span className="font-medium">{t.cardio.activities[c.activity]}</span>
                <span className="num text-sm text-muted">
                  {t.cardio.entry(c.minutes, formatDecimal(c.kcal, 0))}
                </span>
              </div>
            ))}
          </Card>
        )}
        <WaterCard date={todayKey} />
      </section>

      {/* Nutrición */}
      {goal && (
        <section className="mt-6">
          <Link
            to="/nutrition"
            className="mb-3 flex items-center justify-between px-1 text-sm font-medium text-muted"
          >
            {h.nutrition}
            <ChevronRight className="size-4" />
          </Link>
          <Card>
            <p className="flex items-baseline gap-1.5">
              <AnimatedNumber
                value={energy?.totalKcal ?? goal.kcal}
                className="text-3xl font-bold"
              />
              <span className="text-sm text-muted">
                {t.units.kcal} · {h.nutritionTarget}
              </span>
            </p>
            {energy && energy.cardioKcal > 0 && (
              <p className="mt-1 num text-sm text-success">
                {h.cardioBonus(formatDecimal(energy.cardioKcal, 0))}
              </p>
            )}
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

      <CardioSheet open={cardioOpen} onOpenChange={setCardioOpen} />
      <LogWeightSheet
        open={logOpen}
        onOpenChange={setLogOpen}
        initial={stats?.latest?.weightKg ?? null}
      />
    </>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  done,
}: {
  icon: LucideIcon
  label: string
  value: string
  done: boolean
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-lg',
          done ? 'bg-success/15 text-success' : 'bg-card-2 text-success/80',
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className="block truncate num text-sm font-semibold">{value}</span>
      </span>
    </li>
  )
}
