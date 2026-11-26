import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Pencil,
  Plus,
  Scale,
  Trash2,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { CardioSheet } from '@/features/activity/CardioSheet'
import { WaterCard } from '@/features/activity/WaterCard'
import { LogWeightSheet } from '@/features/body/LogWeightSheet'
import {
  useDaySessions,
  useDayWeight,
  useLatestWeight,
  useTemplates,
  useTodayCardio,
  useTodayEnergy,
} from '@/features/profile/hooks'
import { cardioService } from '@/services/activity'
import { workoutService } from '@/services/workout'
import { addDays, fromDateKey, toDateKey } from '@/domain/dates'
import { formatDuration } from '@/domain/workout'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { formatLongDate, t } from '@/i18n'
import { routineText } from '@/i18n/names'

const d = t.day

/**
 * El reporte completo de un día: entrenamientos, cardio, agua, peso y objetivo de calorías.
 * Todo editable, también en días anteriores.
 */
export function DayPage() {
  const { date = '' } = useParams()
  const navigate = useNavigate()
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const today = toDateKey(new Date())

  if (!valid) return <Navigate to={`/day/${today}`} replace />
  return (
    <DayReport
      key={date}
      date={date}
      today={today}
      onGo={(k) => navigate(`/day/${k}`, { replace: true })}
    />
  )
}

function DayReport({
  date,
  today,
  onGo,
}: {
  date: string
  today: string
  onGo: (date: string) => void
}) {
  const navigate = useNavigate()
  const sessions = useDaySessions(date)
  const cardio = useTodayCardio(date)
  const energy = useTodayEnergy(date)
  const weight = useDayWeight(date)
  const latest = useLatestWeight()
  const templates = useTemplates()
  const [cardioOpen, setCardioOpen] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const day = fromDateKey(date)
  const future = date > today
  const prev = toDateKey(addDays(day, -1))
  const next = toDateKey(addDays(day, 1))
  const relative =
    date === today
      ? t.common.today
      : date === toDateKey(addDays(fromDateKey(today), -1))
        ? t.common.yesterday
        : null

  const logWorkout = async (templateId: string | null) => {
    const id = await workoutService.logPast(date, templateId)
    setLogOpen(false)
    navigate(`/workout/${id}/edit`, { state: { fresh: true } })
  }

  return (
    <>
      {/* Encabezado con navegación entre días */}
      <header className="mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onGo(prev)}
          aria-label={d.prev}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-muted hover:text-fg"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          {relative && <p className="text-xs font-medium text-accent-2">{relative}</p>}
          <h1 className="truncate text-xl font-bold tracking-tight first-letter:uppercase">
            {formatLongDate(day)}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onGo(next)}
          disabled={next > today}
          aria-label={d.next}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-muted hover:text-fg disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </header>

      {future ? (
        <p className="py-16 text-center text-muted">{d.future}</p>
      ) : (
        <>
          {/* Objetivo de calorías del día */}
          {energy && (
            <Card className="flex items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-success/12 text-success">
                <Flame className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">{d.energy}</p>
                <p className="num text-2xl font-bold">
                  {formatDecimal(energy.totalKcal, 0)}{' '}
                  <span className="text-sm font-normal text-muted">{t.units.kcal}</span>
                </p>
                {energy.cardioKcal > 0 && (
                  <p className="num text-xs text-success">
                    {d.energyDetail(
                      formatDecimal(energy.baseKcal, 0),
                      formatDecimal(energy.cardioKcal, 0),
                    )}
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Entrenamientos */}
          <Section
            title={d.workouts}
            action={
              <Button
                size="sm"
                variant="ghost"
                className="-mr-2 h-9"
                onClick={() => setLogOpen(true)}
              >
                <Plus />
                {d.logWorkout}
              </Button>
            }
          >
            {sessions && sessions.length > 0 ? (
              <div className="space-y-2.5">
                {sessions.map((s) => (
                  <Card key={s.id} className="flex items-center gap-3 p-4">
                    <Link
                      to={`/workout/${s.id}/summary`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-2">
                        <Dumbbell className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{routineText(s.name)}</span>
                        <span className="block num text-sm text-muted">
                          {formatDuration(s.durationSeconds ?? 0)} · {d.sets(s.sets)} ·{' '}
                          {formatDecimal(s.volume, 0)} {t.units.kg}
                        </span>
                      </span>
                    </Link>
                    <Link
                      to={`/workout/${s.id}/edit`}
                      aria-label={t.workout.edit}
                      className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:text-fg"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty>{d.noWorkouts}</Empty>
            )}
          </Section>

          {/* Cardio */}
          <Section
            title={d.cardio}
            action={
              <Button
                size="sm"
                variant="ghost"
                className="-mr-2 h-9"
                onClick={() => setCardioOpen(true)}
              >
                <Plus />
                {d.addCardio}
              </Button>
            }
          >
            {cardio && cardio.length > 0 ? (
              <Card className="divide-y divide-border py-1">
                {cardio.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-2">
                    <Zap className="size-4 shrink-0 text-success" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {t.cardio.activities[c.activity]}
                    </span>
                    <span className="num text-sm text-muted">
                      {t.cardio.entry(c.minutes, formatDecimal(c.kcal, 0))}
                    </span>
                    <button
                      type="button"
                      onClick={() => void cardioService.remove(c.id)}
                      aria-label={t.cardio.delete}
                      className="-mr-2 grid size-11 place-items-center rounded-xl text-subtle hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </Card>
            ) : (
              <Empty>{d.noCardio}</Empty>
            )}
          </Section>

          {/* Agua */}
          <Section title={d.water}>
            <WaterCard date={date} />
          </Section>

          {/* Peso */}
          <Section title={d.weight}>
            <Card className="flex items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card-2 text-muted">
                <Scale className="size-5" />
              </span>
              <p className="min-w-0 flex-1">
                {weight ? (
                  <>
                    <span className="num text-2xl font-bold">
                      {formatDecimal(weight.weightKg, 1)}
                    </span>{' '}
                    <span className="text-sm text-muted">{t.units.kg}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted">{d.noWeight}</span>
                )}
              </p>
              <Button size="sm" variant="secondary" onClick={() => setWeightOpen(true)}>
                {weight ? <Pencil /> : <Plus />}
                {weight ? t.common.edit : d.logWeight}
              </Button>
            </Card>
          </Section>
        </>
      )}

      <CardioSheet open={cardioOpen} onOpenChange={setCardioOpen} date={date} />
      <LogWeightSheet
        open={weightOpen}
        onOpenChange={setWeightOpen}
        initial={weight?.weightKg ?? latest?.weightKg ?? null}
        date={date}
      />
      <Sheet open={logOpen} onOpenChange={setLogOpen} title={d.logWorkoutTitle}>
        <div className="space-y-2 pt-1">
          {templates?.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => void logWorkout(tpl.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left hover:border-border-strong"
            >
              <Dumbbell className="size-5 shrink-0 text-accent-2" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{routineText(tpl.name)}</span>
                <span className="block num text-sm text-muted">
                  {t.home.exercises(tpl.items.length)}
                </span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => void logWorkout(null)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl border border-dashed border-border-strong px-4 py-3 text-left',
            )}
          >
            <Plus className="size-5 shrink-0 text-muted" />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{d.emptyWorkout}</span>
              <span className="block text-sm text-muted">{d.emptyWorkoutHint}</span>
            </span>
          </button>
        </div>
      </Sheet>
    </>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex min-h-9 items-center justify-between px-1">
        <h2 className="text-sm font-medium text-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-subtle">
      {children}
    </p>
  )
}
