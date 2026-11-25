import { Link } from 'react-router'
import { ChevronRight, ListChecks } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useTemplates } from '@/features/profile/hooks'
import { sortWeekdays } from '@/domain/routine-generator'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import type { Weekday } from '@/types/models'

const w = t.workouts

export function WorkoutsPage() {
  const templates = useTemplates()
  const today = new Date().getDay() as Weekday

  return (
    <>
      <PageHeader title={w.title} subtitle={w.subtitle} />
      {templates === undefined ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState icon={ListChecks} title={w.emptyTitle} description={w.emptyBody} />
      ) : (
        <ul className="space-y-3">
          {templates.map((tpl) => {
            const isToday = tpl.weekdays.includes(today)
            return (
              <li key={tpl.id}>
                <Link
                  to={`/workouts/${tpl.id}`}
                  className={cn(
                    'flex items-center gap-4 rounded-[var(--radius-card)] border bg-card p-4 transition-[transform,border-color] active:scale-[0.99]',
                    isToday ? 'border-accent/50' : 'border-border hover:border-border-strong',
                  )}
                >
                  <div className="flex shrink-0 gap-1">
                    {sortWeekdays(tpl.weekdays).map((d) => (
                      <span
                        key={d}
                        className={cn(
                          'grid size-11 place-items-center rounded-xl text-sm font-semibold',
                          isToday ? 'bg-accent text-accent-fg' : 'bg-accent/12 text-accent-2',
                        )}
                      >
                        {t.labels.weekdayShort[d]}
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{tpl.name}</p>
                    <p className="truncate text-sm text-muted">{tpl.description}</p>
                    <p className="mt-1 num text-xs text-subtle">
                      {t.home.exercises(tpl.items.length)}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
