import { Link, useParams } from 'react-router'
import { ChevronLeft, Clock, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import { useTemplates } from '@/features/profile/hooks'
import { sortWeekdays } from '@/domain/routine-generator'
import { t } from '@/i18n'

const w = t.workouts

export function WorkoutDetailPage() {
  const { id } = useParams()
  const templates = useTemplates()
  const tpl = templates?.find((x) => x.id === id)

  return (
    <>
      <Link
        to="/workouts"
        className="mb-4 -ml-2 inline-flex h-11 items-center gap-1 rounded-xl pr-3 pl-1 text-[0.95rem] font-medium text-muted hover:text-fg"
      >
        <ChevronLeft className="size-5" />
        {w.back}
      </Link>

      {templates === undefined ? (
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
      ) : !tpl ? (
        <p className="text-muted">{w.notFound}</p>
      ) : (
        <>
          <header className="mb-5">
            <div className="flex flex-wrap items-center gap-2">
              {sortWeekdays(tpl.weekdays).map((d) => (
                <Badge key={d} tone="accent" className="capitalize">
                  {t.labels.weekdayLong[d]}
                </Badge>
              ))}
              {tpl.source === 'generated' && <Badge>{w.generated}</Badge>}
            </div>
            <h1 className="mt-3 text-[1.75rem] leading-tight font-bold tracking-tight">
              {tpl.name}
            </h1>
            {tpl.description && <p className="mt-1 text-muted">{tpl.description}</p>}
          </header>

          <ol className="space-y-2.5">
            {tpl.items.map((item, i) => {
              const ex = item.exercise
              const timed = ex?.exerciseType === 'timed'
              return (
                <li key={item.id}>
                  <Card className="flex items-center gap-3.5 p-3.5">
                    {ex && <ExerciseThumbnail exercise={ex} />}
                    <div className="min-w-0 flex-1">
                      <p className="leading-snug font-semibold">
                        <span className="mr-1.5 num text-subtle">{i + 1}.</span>
                        {ex?.name ?? '—'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {[
                          ex?.primaryMuscle && t.labels.muscle[ex.primaryMuscle],
                          ex?.equipment && t.labels.equipment[ex.equipment],
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 num text-sm">
                        <span className="font-semibold text-fg">
                          {w.setsReps(
                            item.targetSets,
                            item.targetRepsMin,
                            item.targetRepsMax,
                            timed,
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-muted">
                          <Clock className="size-3.5" aria-label={w.restLabel} />
                          {w.rest(item.targetRestSeconds)}
                        </span>
                        {item.targetRir !== null && (
                          <span className="text-muted">{w.rir(item.targetRir)}</span>
                        )}
                      </p>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ol>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-border px-4 py-3.5 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>{w.trainingSoon}</span>
          </div>
        </>
      )}
    </>
  )
}
