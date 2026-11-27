import { Link } from 'react-router'
import { Check, Play } from 'lucide-react'
import { HeroCard } from './HeroCard'
import { WeekCard } from './WeekCard'
import { ActiveWorkoutBanner } from '@/features/workout/ActiveWorkoutBanner'
import { useStartWorkout } from '@/features/workout/use-start-workout'
import {
  useActiveSession,
  useHistory,
  useNextTemplateId,
  useTemplates,
} from '@/features/profile/hooks'
import { useDisplayName } from '@/features/profile/use-profile'
import { toDateKey } from '@/domain/dates'
import { formatLongDate, t } from '@/i18n'
import { routineText } from '@/i18n/names'

const h = t.home

/**
 * Inicio, lo esencial: tu personaje, lo que te toca hoy (arriba a la derecha) y tu semana con
 * los desafíos. El resto vive en su sección.
 */
export function HomePage() {
  const name = useDisplayName()
  const templates = useTemplates()
  const nextId = useNextTemplateId()
  const active = useActiveSession()
  const history = useHistory()
  const start = useStartWorkout()

  const now = new Date()
  const todayKey = toDateKey(now)
  const next = templates?.find((x) => x.id === nextId)
  const trainedToday = (history ?? []).some((s) => toDateKey(new Date(s.startedAt)) === todayKey)

  return (
    <>
      <p className="text-sm font-medium text-muted first-letter:uppercase">{formatLongDate(now)}</p>
      <header className="mt-1 mb-5 flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-[1.75rem] leading-tight font-bold tracking-tight">
          {h.greeting(name)}
        </h1>

        {/* Lo que toca hoy, a mano arriba a la derecha */}
        {next && !active && (
          <div className="flex max-w-[56%] shrink-0 items-center gap-2 rounded-2xl border border-border bg-card py-1.5 pr-1.5 pl-3">
            <Link to={`/workouts/${next.id}`} className="min-w-0">
              <span className="flex items-center gap-1 text-[0.7rem] font-medium text-accent-2">
                {trainedToday && <Check className="size-3 text-success" strokeWidth={3} />}
                {trainedToday ? h.doneToday : h.upNext}
              </span>
              <span className="line-clamp-2 text-sm leading-tight font-semibold">
                {routineText(next.name)}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void start(next.id)}
              aria-label={`${h.startWorkout}: ${routineText(next.name)}`}
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg shadow-[0_8px_24px_-8px_rgb(139_92_246/0.8)] transition-transform active:scale-95"
            >
              <Play className="size-5" fill="currentColor" />
            </button>
          </div>
        )}
      </header>

      <ActiveWorkoutBanner />

      <HeroCard trainedToday={trainedToday} />

      <WeekCard className="mt-4" />
    </>
  )
}
