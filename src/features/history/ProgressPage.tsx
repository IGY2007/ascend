import { useState } from 'react'
import { ChevronRight, History, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { LineChart } from '@/components/charts/LineChart'
import { WeightChart } from '@/features/body/WeightChart'
import { LogWeightSheet } from '@/features/body/LogWeightSheet'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import {
  useBodyWeights,
  useExerciseHistory,
  useExercisesDone,
  useGameState,
  useLocalProfile,
} from '@/features/profile/hooks'
import { bodyWeightService } from '@/services/local-data'
import { filterRange, weightStats } from '@/domain/body-weight'
import { fromDateKey, toDateKey } from '@/domain/dates'
import { formatDecimal, formatSigned } from '@/domain/numbers'
import { pctChange } from '@/domain/progress-stats'
import { cn } from '@/lib/utils'
import { locale, t } from '@/i18n'
import { Tip } from '@/components/ui/tip'
import { CalendarView } from '@/features/calendar/CalendarView'
import { JourneyMap } from '@/features/journey/JourneyMap'
import { CAMPS } from '@/domain/journey'
import { STATS, statOf, type Stat as MuscleStatId } from '@/domain/gamification'
import { strengthIndex } from '@/domain/strength-index'
import type { BodyWeight } from '@/types/models'
import { exerciseName } from '@/i18n/names'

const p = t.progress
const ch = t.charts
const TABS = ['month', 'journey', 'strength', 'weight'] as const
type Tab = (typeof TABS)[number]

const entryDate = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const signed = (n: number | null) => (n === null ? '—' : formatSigned(n, 1))

export function ProgressPage() {
  const [tab, setTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem('ascend-progress-tab') as Tab | null
    return saved && TABS.includes(saved) ? saved : 'month'
  })
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
      {tab === 'month' && <MonthTab />}
      {tab === 'journey' && <JourneyTab />}
      {tab === 'strength' && <StrengthTab />}
      {tab === 'weight' && <WeightTab />}
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

function JourneyTab() {
  const game = useGameState()
  return (
    <>
      {game && (
        <p className="mb-3 px-1 text-sm text-muted">
          {t.journey.campOf(game.journey.index + 1, CAMPS.length)} ·{' '}
          {game.journey.next
            ? t.journey.next(
                t.journey.camps[game.journey.next.id]?.name ?? '',
                game.journey.next.level,
              )
            : t.journey.summit}
        </p>
      )}
      <JourneyMap />
    </>
  )
}

function MonthTab() {
  return (
    <>
      <p className="mb-3 px-1 text-sm text-muted">{t.calendar.tapHint}</p>
      <CalendarView />
    </>
  )
}

// ---------------------------------------------------------------- Fuerza

function StrengthTab() {
  const done = useExercisesDone()
  const game = useGameState()
  const [group, setGroup] = useState<MuscleStatId | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(null)

  if (done === undefined || !game) return <Skeleton className="h-64 rounded-[var(--radius-card)]" />
  if (done.length === 0)
    return <EmptyState icon={History} title={ch.e1rmTitle} description={ch.noExercises} />

  const groupOf = (d: (typeof done)[number]) =>
    d.exercise.primaryMuscle ? statOf(d.exercise.primaryMuscle) : null
  const groups = STATS.filter((g) => done.some((d) => groupOf(d) === g))
  const inGroup = group === 'all' ? [] : done.filter((d) => groupOf(d) === group)
  const index = strengthIndex(game.facts.exerciseSets, group === 'all' ? undefined : group)
  const now = index.at(-1)?.value ?? 100

  const chip = (active: boolean) =>
    cn(
      'h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
      active ? 'border-accent/60 bg-accent/14 text-fg' : 'border-border text-muted',
    )

  return (
    <>
      <div
        className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1"
        role="radiogroup"
        aria-label={ch.group}
      >
        <button
          type="button"
          role="radio"
          aria-checked={group === 'all'}
          onClick={() => setGroup('all')}
          className={chip(group === 'all')}
        >
          {ch.general}
        </button>
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={group === g}
            onClick={() => {
              setGroup(g)
              setSelected(null)
            }}
            className={chip(group === g)}
          >
            {t.game.muscles.stats[g]}
          </button>
        ))}
      </div>

      <Card className="mt-4 px-4">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <p className="font-semibold">
            {group === 'all' ? ch.generalTitle : ch.groupTitle(t.game.muscles.stats[group])}
          </p>
          <p
            className={cn(
              'num text-lg font-bold',
              now > 100.5 ? 'text-success' : now < 99.5 ? 'text-danger' : 'text-muted',
            )}
          >
            {formatSigned(now - 100, 1)}%
          </p>
        </div>
        <p className="mt-1 mb-3 px-1 text-xs leading-relaxed text-muted">{ch.indexExplain}</p>
        <LineChart
          points={index.map((x) => ({ date: x.date, value: x.value - 100 }))}
          unit="%"
          label={ch.generalTitle}
          emptyText={ch.indexNeedsTwo}
          decimals={0}
        />
      </Card>

      {group === 'all' ? (
        <Card className="mt-4 divide-y divide-border p-0">
          {groups.map((g) => {
            const v = strengthIndex(game.facts.exerciseSets, g).at(-1)?.value ?? 100
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
              >
                <span className="font-medium">{t.game.muscles.stats[g]}</span>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'num text-sm font-semibold',
                      v > 100.5 ? 'text-success' : 'text-muted',
                    )}
                  >
                    {formatSigned(v - 100, 1)}%
                  </span>
                  <ChevronRight className="size-4 text-subtle" />
                </span>
              </button>
            )
          })}
        </Card>
      ) : (
        <ExerciseDetail
          list={inGroup}
          current={selected ?? inGroup[0]?.exercise.id ?? null}
          onPick={setSelected}
        />
      )}
    </>
  )
}

function ExerciseDetail({
  list,
  current,
  onPick,
}: {
  list: NonNullable<ReturnType<typeof useExercisesDone>>
  current: string | null
  onPick: (id: string) => void
}) {
  const points = useExerciseHistory(current)
  const summary = list.find((d) => d.exercise.id === current)
  const first = points?.[0]
  const last = points?.at(-1)
  const sinceStart = first && last && points!.length > 1 ? pctChange(last.e1rm, first.e1rm) : null

  return (
    <>
      <h3 className="mt-6 mb-2 px-1 text-sm font-medium text-muted">{ch.exercise}</h3>
      <div
        className="-mx-5 flex [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-1"
        role="radiogroup"
        aria-label={ch.exercise}
      >
        {list.map((d) => (
          <button
            key={d.exercise.id}
            type="button"
            role="radio"
            aria-checked={current === d.exercise.id}
            onClick={() => onPick(d.exercise.id)}
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
        </Card>
      )}
      <Tip className="mt-4">{ch.e1rmExplain}</Tip>
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
