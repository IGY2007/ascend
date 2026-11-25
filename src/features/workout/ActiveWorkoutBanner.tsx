import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Timer } from 'lucide-react'
import { useActiveSession } from '@/features/profile/hooks'
import { formatDuration } from '@/domain/workout'
import { t } from '@/i18n'

/** Aviso de entrenamiento en curso, con el tiempo corriendo. Toca para retomarlo. */
export function ActiveWorkoutBanner() {
  const active = useActiveSession()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])
  if (!active) return null
  const elapsed = (now - new Date(active.startedAt).getTime()) / 1000
  return (
    <Link
      to={`/workout/${active.id}`}
      className="mb-5 flex items-center gap-3 rounded-2xl border border-accent/50 bg-accent/14 px-4 py-3 transition-transform active:scale-[0.99]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg">
        <Timer className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-accent-2">{t.workouts.activeBanner}</span>
        <span className="block truncate font-semibold">{active.name}</span>
      </span>
      <span className="num text-lg font-semibold">{formatDuration(elapsed)}</span>
      <ChevronRight className="size-5 text-muted" />
    </Link>
  )
}
