import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Clock, ListChecks, Play, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useActiveSession,
  useHistory,
  useLocalProfile,
  useNextTemplateId,
  useTemplates,
} from '@/features/profile/hooks'
import { ActiveWorkoutBanner } from '@/features/workout/ActiveWorkoutBanner'
import { useStartWorkout } from '@/features/workout/use-start-workout'
import { CardioSheet } from '@/features/activity/CardioSheet'
import { daysBetween, startOfWeek, toDateKey } from '@/domain/dates'
import type { TemplateWithExercises } from '@/services/local-data'
import type { MuscleGroup } from '@/types/models'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { AddSheet } from './AddSheet'
import { routineText } from '@/i18n/names'

const w = t.workouts

/** Los grupos musculares principales de la rutina, en orden de aparición. */
function musclesOf(tpl: TemplateWithExercises, max = 3): MuscleGroup[] {
  const out: MuscleGroup[] = []
  for (const it of tpl.items) {
    const m = it.exercise?.primaryMuscle
    if (m && m !== 'other' && !out.includes(m)) out.push(m)
  }
  return out.slice(0, max)
}

export function WorkoutsPage() {
  const templates = useTemplates()
  const nextId = useNextTemplateId()
  const history = useHistory()
  const profile = useLocalProfile()
  const active = useActiveSession()
  const start = useStartWorkout()
  const [addOpen, setAddOpen] = useState(false)
  const [cardioOpen, setCardioOpen] = useState(false)

  const today = toDateKey(new Date())
  const weekStart = toDateKey(startOfWeek(new Date()))
  const doneThisWeek = (history ?? []).filter(
    (s) => toDateKey(new Date(s.startedAt)) >= weekStart,
  ).length
  const lastDone = new Map<string, string>()
  for (const s of history ?? []) {
    if (s.templateId && !lastDone.has(s.templateId))
      lastDone.set(s.templateId, toDateKey(new Date(s.startedAt)))
  }
  const lastLabel = (id: string) => {
    const d = lastDone.get(id)
    return d ? w.lastDone(w.ago(daysBetween(d, today))) : w.neverDone
  }

  const next = templates?.find((x) => x.id === nextId)
  const rotation = (templates ?? []).filter((x) => x.inRotation !== false)
  const extras = (templates ?? []).filter((x) => x.inRotation === false)
  const goal = profile?.daysPerWeek ?? 0

  return (
    <>
      <PageHeader
        title={w.title}
        subtitle={goal ? w.weekGoal(doneThisWeek, goal) : undefined}
        action={
          <Button
            size="icon"
            onClick={() => setAddOpen(true)}
            aria-label={w.add}
            className="size-12 rounded-2xl"
          >
            <Plus className="size-6" />
          </Button>
        }
      />
      <ActiveWorkoutBanner />

      {templates === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-48 rounded-[var(--radius-card)]" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState icon={ListChecks} title={w.emptyTitle} description={w.emptyBody} />
      ) : (
        <>
          {/* La que toca */}
          {next && !active && (
            <Card highlight>
              <Link to={`/workouts/${next.id}`} className="block">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <span className="size-1.5 rounded-full bg-gold" />
                    {w.nextUp}
                  </p>
                  <ChevronRight className="size-5 text-muted" />
                </div>
                <p className="mt-1 text-2xl font-bold tracking-tight">{routineText(next.name)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {musclesOf(next, 4).map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-bg-2/70 px-2.5 py-1 text-xs font-medium text-fg/85"
                    >
                      {t.labels.muscle[m]}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-3 num text-sm text-muted">
                  <span>{t.home.exercises(next.items.length)}</span>
                  {profile && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {t.home.approxMinutes(profile.sessionMinutes)}
                    </span>
                  )}
                </p>
              </Link>
              <Button size="lg" block className="mt-4" onClick={() => void start(next.id)}>
                <Play />
                {w.startThis}
              </Button>
              <p className="mt-2.5 text-center text-xs text-subtle">{lastLabel(next.id)}</p>
            </Card>
          )}

          {/* Todas las rutinas, en el orden de la rotación */}
          <h2 className="mt-7 mb-3 px-1 text-sm font-medium text-muted">{w.allRoutines}</h2>
          <ol className="space-y-2.5">
            {rotation.map((tpl, i) => {
              const isNext = tpl.id === nextId
              return (
                <li key={tpl.id}>
                  <Link
                    to={`/workouts/${tpl.id}`}
                    className={cn(
                      'flex items-center gap-4 rounded-[var(--radius-card)] border bg-card p-4 transition-[transform,border-color] active:scale-[0.99]',
                      isNext ? 'border-accent/40' : 'border-border hover:border-border-strong',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-11 shrink-0 place-items-center rounded-xl num text-base font-semibold',
                        isNext ? 'bg-accent text-accent-fg' : 'bg-card-2 text-muted',
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{routineText(tpl.name)}</p>
                      <p className="truncate text-sm text-muted">
                        {musclesOf(tpl)
                          .map((m) => t.labels.muscle[m])
                          .join(' · ') || t.home.exercises(tpl.items.length)}
                      </p>
                      <p
                        className={cn(
                          'mt-0.5 text-xs',
                          lastDone.has(tpl.id) ? 'text-subtle' : 'text-subtle/80',
                        )}
                      >
                        {t.home.exercises(tpl.items.length)} · {lastLabel(tpl.id)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted" />
                  </Link>
                </li>
              )
            })}
          </ol>

          {extras.length > 0 && (
            <>
              <h2 className="mt-7 px-1 text-sm font-medium text-muted">{w.extras}</h2>
              <p className="mb-3 px-1 text-xs text-subtle">{w.extrasHint}</p>
              <ul className="space-y-2.5">
                {extras.map((tpl) => (
                  <li key={tpl.id}>
                    <Link
                      to={`/workouts/${tpl.id}`}
                      className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4 transition-transform active:scale-[0.99]"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/12 text-success">
                        <Sparkles className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{routineText(tpl.name)}</p>
                        <p className="truncate text-sm text-muted">
                          {musclesOf(tpl)
                            .map((m) => t.labels.muscle[m])
                            .join(' · ')}
                        </p>
                        <p className="mt-0.5 text-xs text-subtle">
                          {t.home.exercises(tpl.items.length)} · {lastLabel(tpl.id)}
                        </p>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <AddSheet open={addOpen} onOpenChange={setAddOpen} onCardio={() => setCardioOpen(true)} />
      <CardioSheet open={cardioOpen} onOpenChange={setCardioOpen} />
    </>
  )
}
