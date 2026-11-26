import { useState } from 'react'
import { ChevronRight, History, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, type Bar } from '@/components/charts/BarChart'
import { LineChart } from '@/components/charts/LineChart'
import { WeightChart } from '@/features/body/WeightChart'
import { LogWeightSheet } from '@/features/body/LogWeightSheet'
import { CardioSheet } from '@/features/activity/CardioSheet'
import { InsightsCard } from '@/features/progress/InsightsCard'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import {
  useBodyWeights,
  useCardioLogs,
  useExerciseHistory,
  useExercisesDone,
  useHistory,
  useLocalProfile,
  useWaterDaily,
  useWaterTarget,
  useWeeklyStats,
} from '@/features/profile/hooks'
import { bodyWeightService } from '@/services/local-data'
import { cardioService } from '@/services/activity'
import { filterRange, weightStats } from '@/domain/body-weight'
import { fromDateKey, toDateKey } from '@/domain/dates'
import { formatDecimal, formatSigned } from '@/domain/numbers'
import { pctChange, type WeekBucket } from '@/domain/progress-stats'
import { formatDuration } from '@/domain/workout'
import { cn } from '@/lib/utils'
import { locale, t } from '@/i18n'
import { CalendarView } from '@/features/calendar/CalendarView'
import { PhysiqueTab } from '@/features/game/PhysiqueTab'
import type { BodyWeight, CardioLog } from '@/types/models'
import { exerciseName, routineText } from '@/i18n/names'

const p = t.progress
const ch = t.charts
const TABS = ['summary', 'calendar', 'muscles', 'strength', 'weight', 'cardio'] as const
type Tab = (typeof TABS)[number]

const entryDate = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
const signed = (n: number | null) => (n === null ? '—' : formatSigned(n, 1))

const weekBars = (buckets: WeekBucket[]): Bar[] =>
  buckets.map((b) => {
    const d = fromDateKey(b.weekStart)
    return {
      key: b.weekStart,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      title: ch.weekOf(dayMonth.format(d)),
      value: b.value,
    }
  })

export function ProgressPage() {
  const [tab, setTab] = useState<Tab>(
    () => (sessionStorage.getItem('ascend-progress-tab') as Tab) || 'summary',
  )
  const choose = (next: Tab) => {
    setTab(next)
    sessionStorage.setItem('ascend-progress-tab', next)
  }

  return (
    <>
      <PageHeader title={p.title} />
      {/* Pestañas en una fila arriba de los gráficos */}
      <div className="-mx-5 mb-5 [scrollbar-width:none] overflow-x-auto px-5">
        <div className="flex w-max gap-1 rounded-2xl bg-card p-1" role="tablist">
          {TABS.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => choose(k)}
              className={cn(
                'h-10 rounded-xl px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
                tab === k ? 'bg-accent text-accent-fg' : 'text-muted',
              )}
            >
              {ch.tabs[k]}
            </button>
          ))}
        </div>
      </div>
      {tab === 'summary' && <SummaryTab />}
      {tab === 'calendar' && (
        <>
          <p className="mb-3 px-1 text-sm text-muted">{t.calendar.tapHint}</p>
          <CalendarView />
        </>
      )}
      {tab === 'muscles' && <PhysiqueTab />}
      {tab === 'strength' && <StrengthTab />}
      {tab === 'weight' && <WeightTab />}
      {tab === 'cardio' && <CardioWaterTab />}
    </>
  )
}

function Section({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('mt-6', className)}>
      <h2 className="mb-3 px-1 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------- Resumen

function SummaryTab() {
  const today = toDateKey(new Date())
  const weekly = useWeeklyStats(today)
  const history = useHistory()

  return (
    <>
      <InsightsCard />
      <Section title={ch.sessionsPerWeek}>
        <Card className="px-3">
          {weekly ? (
            <BarChart
              bars={weekBars(weekly.sessions)}
              unit={ch.sessionsUnit}
              label={ch.sessionsPerWeek}
            />
          ) : (
            <Skeleton className="h-40" />
          )}
        </Card>
      </Section>
      <Section title={ch.volumePerWeek}>
        <Card className="px-3">
          {weekly ? (
            <BarChart bars={weekBars(weekly.volume)} unit={t.units.kg} label={ch.volumePerWeek} />
          ) : (
            <Skeleton className="h-40" />
          )}
        </Card>
      </Section>
      <Section title={p.historyTitle}>
        {history === undefined ? (
          <Skeleton className="h-24 rounded-[var(--radius-card)]" />
        ) : history.length === 0 ? (
          <EmptyState icon={History} title={p.emptyTitle} description={p.emptyBody} />
        ) : (
          <ul className="space-y-2">
            {history.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/workout/${s.id}/summary`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-transform active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{routineText(s.name)}</span>
                    <span className="block text-sm text-muted first-letter:uppercase">
                      {entryDate.format(new Date(s.startedAt))} ·{' '}
                      {p.sessionMeta(formatDuration(s.durationSeconds ?? 0), s.sets)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right num text-sm font-semibold">
                    {formatDecimal(s.volume, 0)}{' '}
                    <span className="text-xs font-normal text-muted">{t.units.kg}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}

// ---------------------------------------------------------------- Fuerza

function StrengthTab() {
  const done = useExercisesDone()
  const [selected, setSelected] = useState<string | null>(null)
  const current = selected ?? done?.[0]?.exercise.id ?? null
  const points = useExerciseHistory(current)
  const summary = done?.find((d) => d.exercise.id === current)

  if (done === undefined) return <Skeleton className="h-64 rounded-[var(--radius-card)]" />
  if (done.length === 0)
    return <EmptyState icon={History} title={ch.e1rmTitle} description={ch.noExercises} />

  const first = points?.[0]
  const last = points?.at(-1)
  const sinceStart = first && last && points!.length > 1 ? pctChange(last.e1rm, first.e1rm) : null

  return (
    <>
      <div
        className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1"
        role="radiogroup"
        aria-label={ch.exercise}
      >
        {done.map((d) => (
          <button
            key={d.exercise.id}
            type="button"
            role="radio"
            aria-checked={current === d.exercise.id}
            onClick={() => setSelected(d.exercise.id)}
            className={cn(
              'flex h-11 shrink-0 items-center gap-2 rounded-full border pr-3.5 pl-1.5 text-sm font-medium transition-colors',
              current === d.exercise.id
                ? 'border-accent/60 bg-accent/14 text-fg'
                : 'border-border text-muted',
            )}
          >
            <ExerciseThumbnail exercise={d.exercise} className="size-8 rounded-full" />
            <span className="max-w-44 truncate">{exerciseName(d.exercise)}</span>
          </button>
        ))}
      </div>

      {summary && (
        <Card className="mt-4 px-4">
          <p className="truncate px-1 font-semibold">{exerciseName(summary.exercise)}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 px-1">
            <Stat label={ch.bestE1rm} value={formatDecimal(summary.best, 1)} unit={t.units.kg} />
            <Stat
              label={ch.maxWeight}
              value={last ? formatDecimal(Math.max(...points!.map((x) => x.maxWeight)), 1) : '—'}
              unit={t.units.kg}
            />
            <Stat
              label={ch.sinceStart}
              value={sinceStart !== null ? `${formatSigned(sinceStart, 1)}%` : '—'}
            />
          </div>
          <p className="mt-5 mb-2 px-1 text-xs font-medium text-muted">{ch.e1rmTitle}</p>
          <LineChart
            points={(points ?? []).map((x) => ({ date: x.date, value: x.e1rm }))}
            unit={t.units.kg}
            label={ch.e1rmTitle}
            emptyText={ch.needsTwo}
          />
          <p className="mt-2 px-1 text-xs text-subtle">{t.workout.e1rmNote}</p>
        </Card>
      )}

      {points && points.length > 0 && (
        <Card className="mt-4 divide-y divide-border p-0">
          {[...points].reverse().map((pt) => (
            <div
              key={pt.date + pt.e1rm}
              className="flex items-center justify-between gap-3 px-5 py-3 text-[0.95rem]"
            >
              <span className="text-muted first-letter:uppercase">
                {entryDate.format(fromDateKey(pt.date))}
              </span>
              <span className="num text-sm text-muted">
                {formatDecimal(pt.maxWeight, 1)} {t.units.kg} máx.
              </span>
              <span className="num font-semibold">{formatDecimal(pt.e1rm, 1)}</span>
            </div>
          ))}
        </Card>
      )}
    </>
  )
}

// ---------------------------------------------------------------- Peso

const RANGES = [
  { key: 'd30', days: 30 },
  { key: 'd90', days: 90 },
  { key: 'all', days: null },
] as const

function WeightTab() {
  const weights = useBodyWeights()
  const profile = useLocalProfile()
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('d30')
  const [logOpen, setLogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<BodyWeight | null>(null)

  const today = toDateKey(new Date())
  const ascending = weights ? [...weights].reverse() : []
  const stats = weightStats(ascending, today, profile?.targetWeightKg ?? null)
  const days = RANGES.find((r) => r.key === range)?.days ?? null
  const points = filterRange(ascending, today, days)

  return (
    <>
      <Button block onClick={() => setLogOpen(true)}>
        <Plus />
        {p.logWeight}
      </Button>
      {weights === undefined ? (
        <Skeleton className="mt-4 h-80 rounded-[var(--radius-card)]" />
      ) : (
        <Card className="mt-4 px-4">
          <div className="grid grid-cols-3 gap-2 px-1">
            <Stat
              label={t.home.weight}
              value={stats.latest ? formatDecimal(stats.latest.weightKg, 1) : '—'}
              unit={t.units.kg}
              big
            />
            <Stat
              label={p.weekAvg}
              value={stats.weekAvg !== null ? formatDecimal(stats.weekAvg, 1) : '—'}
              unit={t.units.kg}
            />
            <Stat label={p.totalChange} value={signed(stats.totalChange)} unit={t.units.kg} />
          </div>
          <div className="mt-5 mb-3 flex gap-1.5 px-1" role="radiogroup">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={range === r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  'h-9 rounded-full px-3.5 text-sm font-medium transition-colors',
                  range === r.key ? 'bg-accent/16 text-accent-2' : 'text-muted hover:text-fg',
                )}
              >
                {p.ranges[r.key]}
              </button>
            ))}
          </div>
          <WeightChart points={points} />
        </Card>
      )}

      {weights && weights.length > 0 && (
        <Section title={p.entries}>
          <Card className="divide-y divide-border p-0">
            {weights.map((w, i) => {
              const prev = weights[i + 1]
              const diff = prev ? Math.round((w.weightKg - prev.weightKg) * 10) / 10 : null
              return (
                <div key={w.id} className="flex items-center gap-3 py-1 pr-1 pl-5">
                  <span className="flex-1 text-[0.95rem] text-muted first-letter:uppercase">
                    {entryDate.format(fromDateKey(w.date))}
                  </span>
                  {diff !== null && diff !== 0 && (
                    <span className="num text-xs text-subtle">{signed(diff)}</span>
                  )}
                  <span className="w-20 text-right num font-semibold">
                    {formatDecimal(w.weightKg, 1)}{' '}
                    <span className="text-xs font-normal text-muted">{t.units.kg}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setToDelete(w)}
                    aria-label={p.deleteEntry}
                    className="grid size-11 place-items-center rounded-xl text-subtle transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )
            })}
          </Card>
        </Section>
      )}

      <LogWeightSheet
        open={logOpen}
        onOpenChange={setLogOpen}
        initial={stats.latest?.weightKg ?? null}
      />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={p.deleteConfirmTitle}
        description={
          toDelete ? p.deleteConfirmBody(entryDate.format(fromDateKey(toDelete.date))) : ''
        }
        confirmLabel={p.delete}
        destructive
        onConfirm={() => {
          if (toDelete) void bodyWeightService.remove(toDelete.id)
          setToDelete(null)
        }}
      />
    </>
  )
}

// ---------------------------------------------------------------- Cardio y agua

function CardioWaterTab() {
  const today = toDateKey(new Date())
  const weekly = useWeeklyStats(today)
  const water = useWaterDaily(today)
  const target = useWaterTarget()
  const logs = useCardioLogs()
  const [cardioOpen, setCardioOpen] = useState(false)
  const [toDelete, setToDelete] = useState<CardioLog | null>(null)

  return (
    <>
      <Button block onClick={() => setCardioOpen(true)}>
        <Plus />
        {t.cardio.title}
      </Button>
      <Section title={ch.cardioPerWeek}>
        <Card className="px-3">
          {weekly ? (
            <BarChart
              bars={weekBars(weekly.cardioMinutes)}
              unit={ch.min}
              label={ch.cardioPerWeek}
            />
          ) : (
            <Skeleton className="h-40" />
          )}
        </Card>
      </Section>
      <Section title={ch.waterPerDay}>
        <Card className="px-3">
          {water ? (
            <BarChart
              bars={water.map((d) => {
                const date = fromDateKey(d.date)
                return {
                  key: d.date,
                  label: String(date.getDate()),
                  title: entryDate.format(date),
                  value: d.value,
                }
              })}
              unit={ch.ml}
              label={ch.waterPerDay}
              target={target}
            />
          ) : (
            <Skeleton className="h-40" />
          )}
          <p className="mt-2 px-1 text-xs text-subtle">{t.water.note}</p>
        </Card>
      </Section>
      {logs && logs.length > 0 && (
        <Section title={t.cardio.history}>
          <Card className="divide-y divide-border p-0">
            {logs.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-1 pr-1 pl-5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {t.cardio.activities[c.activity]}
                  </span>
                  <span className="block text-xs text-muted first-letter:uppercase">
                    {entryDate.format(fromDateKey(c.date))} · {t.cardio.intensities[c.intensity]}
                  </span>
                </span>
                <span className="num text-sm text-muted">
                  {t.cardio.entry(c.minutes, formatDecimal(c.kcal, 0))}
                </span>
                <button
                  type="button"
                  onClick={() => setToDelete(c)}
                  aria-label={t.cardio.delete}
                  className="grid size-11 place-items-center rounded-xl text-subtle hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </Card>
        </Section>
      )}
      <CardioSheet open={cardioOpen} onOpenChange={setCardioOpen} />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t.cardio.delete}
        description={
          toDelete
            ? `${t.cardio.activities[toDelete.activity]} · ${t.cardio.entry(toDelete.minutes, formatDecimal(toDelete.kcal, 0))}`
            : ''
        }
        confirmLabel={p.delete}
        destructive
        onConfirm={() => {
          if (toDelete) void cardioService.remove(toDelete.id)
          setToDelete(null)
        }}
      />
    </>
  )
}

function Stat({
  label,
  value,
  unit,
  big,
}: {
  label: string
  value: string
  unit?: string
  big?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className={cn('mt-1 num font-bold', big ? 'text-2xl' : 'text-lg')}>
        {value}
        {unit && value !== '—' && (
          <span className="ml-0.5 text-xs font-normal text-muted">{unit}</span>
        )}
      </p>
    </div>
  )
}
