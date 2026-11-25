import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, ListChecks, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useNextTemplateId, useTemplates } from '@/features/profile/hooks'
import { ActiveWorkoutBanner } from '@/features/workout/ActiveWorkoutBanner'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { AddSheet } from './AddSheet'
import { CardioSheet } from '@/features/activity/CardioSheet'

const w = t.workouts

export function WorkoutsPage() {
  const templates = useTemplates()
  const nextId = useNextTemplateId()
  const [addOpen, setAddOpen] = useState(false)
  const [cardioOpen, setCardioOpen] = useState(false)

  return (
    <>
      <PageHeader
        title={w.title}
        subtitle={w.subtitle}
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
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState icon={ListChecks} title={w.emptyTitle} description={w.emptyBody} />
      ) : (
        <>
          <p className="mb-3 px-1 text-sm text-muted">{w.rotation}</p>
          <ol className="space-y-2.5">
            {templates.map((tpl, i) => {
              const isNext = tpl.id === nextId
              return (
                <li key={tpl.id}>
                  <Link
                    to={`/workouts/${tpl.id}`}
                    className={cn(
                      'flex items-center gap-4 rounded-[var(--radius-card)] border bg-card p-4 transition-[transform,border-color] active:scale-[0.99]',
                      isNext ? 'border-accent/50' : 'border-border hover:border-border-strong',
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
                      {isNext && <p className="text-xs font-medium text-accent-2">{w.nextUp}</p>}
                      <p className="truncate font-semibold">{tpl.name}</p>
                      <p className="num text-sm text-muted">{t.home.exercises(tpl.items.length)}</p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted" />
                  </Link>
                </li>
              )
            })}
          </ol>
        </>
      )}
      <AddSheet open={addOpen} onOpenChange={setAddOpen} onCardio={() => setCardioOpen(true)} />
      <CardioSheet open={cardioOpen} onOpenChange={setCardioOpen} />
    </>
  )
}
