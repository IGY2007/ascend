import { useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  Droplet,
  Dumbbell,
  Moon,
  Pencil,
  Pill,
  Sun,
  Sunrise,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber } from '@/components/ui/animated-number'
import {
  useDaySessions,
  useLatestWeight,
  useLocalProfile,
  useNutritionGoal,
  useTodayCardio,
  useTodayEnergy,
  useWaterTarget,
} from '@/features/profile/hooks'
import { mealPlan, type MealKey, type TrainingTime } from '@/domain/meal-plan'
import { toDateKey } from '@/domain/dates'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { MacroTiles } from './MacroTiles'
import { EditMacrosSheet } from './EditMacrosSheet'

const n = t.nutrition
const TIME_KEY = 'ascend-training-time'
const TIMES: [TrainingTime, LucideIcon][] = [
  ['morning', Sunrise],
  ['midday', Sun],
  ['evening', Moon],
]
const AROUND_TRAINING: MealKey[] = ['pre', 'post']

const SOURCES = [
  {
    label: 'ISSN Position Stand: protein and exercise (2017)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28642676/',
  },
  {
    label: 'ISSN Position Stand: nutrient timing (2017)',
    url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0189-4',
  },
  {
    label: 'Morton et al., BJSM meta-analysis on protein (2018)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/',
  },
  {
    label: 'ACSM / AND / DC: Nutrition and Athletic Performance (2016)',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26917108/',
  },
]

function readTime(): TrainingTime {
  const v = localStorage.getItem(TIME_KEY)
  return v === 'morning' || v === 'midday' || v === 'evening' ? v : 'evening'
}

/** Nutrición: objetivo del día, cómo repartir las comidas según cuándo entrenás, y lo básico. */
export function NutritionPage() {
  const today = toDateKey(new Date())
  const goal = useNutritionGoal()
  const energy = useTodayEnergy(today)
  const profile = useLocalProfile()
  const latest = useLatestWeight()
  const sessions = useDaySessions(today)
  const cardio = useTodayCardio(today)
  const waterTarget = useWaterTarget()
  const [time, setTime] = useState<TrainingTime>(readTime)
  const [editOpen, setEditOpen] = useState(false)

  const chooseTime = (v: TrainingTime) => {
    setTime(v)
    localStorage.setItem(TIME_KEY, v)
  }

  if (goal === undefined) {
    return (
      <>
        <PageHeader title={n.title} subtitle={n.subtitle} />
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
      </>
    )
  }
  if (goal === null) return <PageHeader title={n.title} subtitle={n.subtitle} />

  const weight = latest?.weightKg ?? profile?.weightKg ?? null
  const perKg = weight ? formatDecimal(goal.proteinG / weight, 1) : null
  const trainingDay = (sessions?.length ?? 0) > 0 || (cardio?.length ?? 0) > 0
  // Los gramos extra del cardio se suman como carbohidratos (el combustible del ejercicio).
  const extraCarbs = Math.round((energy?.cardioKcal ?? 0) / 4)
  const meals = mealPlan(
    { proteinG: goal.proteinG, carbsG: goal.carbsG + extraCarbs, fatG: goal.fatG },
    time,
  )
  const perMeal = Math.round(goal.proteinG / meals.length / 5) * 5

  return (
    <>
      <PageHeader title={n.title} subtitle={n.subtitle} />

      {/* Objetivo de hoy */}
      <Card highlight>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted">
              {n.todayTarget}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[0.7rem] font-semibold',
                  trainingDay ? 'bg-success/15 text-success' : 'bg-card-2 text-muted',
                )}
              >
                {trainingDay ? n.trainingDay : n.restDay}
              </span>
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <AnimatedNumber
                value={energy?.totalKcal ?? goal.kcal}
                className="text-4xl font-bold"
              />
              <span className="text-sm text-muted">{t.units.kcal}</span>
            </p>
            {energy && energy.cardioKcal > 0 && (
              <p className="num text-sm text-success">
                {t.home.cardioBonus(formatDecimal(energy.cardioKcal, 0))}
              </p>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil />
            {t.common.edit}
          </Button>
        </div>
        <MacroTiles macros={goal} className="mt-4" />
        {perKg && (
          <p className="mt-4 border-t border-border pt-3 text-sm leading-relaxed text-muted">
            {n.proteinWhy(String(goal.proteinG), perKg)}
          </p>
        )}
      </Card>

      {/* Reparto de comidas */}
      <section className="mt-8">
        <h2 className="px-1 text-lg font-semibold tracking-tight">{n.mealsTitle}</h2>
        <p className="mt-0.5 px-1 text-sm text-muted">
          {n.mealsSubtitle(meals.length, String(perMeal))}
        </p>
        <p className="mt-4 mb-2 px-1 text-xs font-medium text-subtle">{n.trainingTime}</p>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-card p-1" role="radiogroup">
          {TIMES.map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={time === key}
              onClick={() => chooseTime(key)}
              className={cn(
                'flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors',
                time === key ? 'bg-accent text-accent-fg' : 'text-muted',
              )}
            >
              <Icon className="size-4" />
              {n.trainingTimes[key]}
            </button>
          ))}
        </div>

        <ol className="relative mt-5 space-y-3 before:absolute before:top-3 before:bottom-3 before:left-[1.05rem] before:w-px before:bg-border">
          {meals.map((m) => {
            const around = AROUND_TRAINING.includes(m.key)
            const when = m.key in n.mealWhen ? n.mealWhen[m.key as keyof typeof n.mealWhen] : null
            return (
              <li key={m.key} className="relative flex gap-3">
                <span
                  className={cn(
                    'relative z-10 mt-3 grid size-[2.1rem] shrink-0 place-items-center rounded-full border',
                    around
                      ? 'border-success/50 bg-success/12 text-success'
                      : 'border-border bg-card text-muted',
                  )}
                >
                  {around ? (
                    <Dumbbell className="size-4" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <Card className="min-w-0 flex-1 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold">{n.meal[m.key]}</p>
                    <p className="shrink-0 num text-xs text-muted">
                      {n.mealMacros(m.proteinG, m.carbsG, m.fatG)}
                    </p>
                  </div>
                  {when && <p className="mt-0.5 text-xs font-medium text-success">{when}</p>}
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{n.mealTip[m.key]}</p>
                </Card>
              </li>
            )
          })}
        </ol>
      </section>

      {/* Hidratación */}
      {waterTarget && (
        <Card className="mt-8 flex gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-300/10 text-sky-300">
            <Droplet className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{n.hydrationTitle}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {n.hydrationBody(formatDecimal(waterTarget / 1000, 2))}
            </p>
          </div>
        </Card>
      )}

      {/* Lo básico */}
      <Learn icon={BookOpen} title={n.learnTitle} items={n.lessons} />
      <Learn icon={Pill} title={n.supplementsTitle} items={n.supplements} />

      <p className="mt-8 px-1 text-xs leading-relaxed text-subtle">{n.disclaimer}</p>
      <details className="mt-2 px-1 text-xs text-subtle">
        <summary className="cursor-pointer py-2 font-medium">{n.sources}</summary>
        <ul className="space-y-1.5 pb-2">
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </details>

      {goal && <EditMacrosSheet open={editOpen} onOpenChange={setEditOpen} current={goal} />}
    </>
  )
}

function Learn({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon
  title: string
  items: readonly { title: string; body: string }[]
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 px-1 text-lg font-semibold tracking-tight">
        <Icon className="size-5 text-accent-2" />
        {title}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
        {items.map((it) => (
          <details key={it.title} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1">{it.title}</span>
              <ChevronDown className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted">{it.body}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
