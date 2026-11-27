import { Link } from 'react-router'
import { ChevronRight, Mountain } from 'lucide-react'
import { useGameState } from '@/features/profile/hooks'
import { CAMPS } from '@/domain/journey'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const j = t.journey

/** Tu lugar en la montaña, en chiquito, para Inicio. */
export function JourneyCard({ className }: { className?: string }) {
  const game = useGameState()
  if (!game) return null
  const { journey } = game
  const name = j.camps[journey.current.id]?.name
  const next = journey.next ? j.camps[journey.next.id]?.name : null
  return (
    <Link
      to="/journey"
      className={cn(
        'flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 transition-transform active:scale-[0.99]',
        className,
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-accent to-[#2e1065] text-white">
        <Mountain className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{name}</span>
          <span className="shrink-0 num text-xs text-muted">
            {journey.index + 1}/{CAMPS.length}
          </span>
        </span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-card-2">
          <span
            className="block h-full origin-left rounded-full bg-gradient-to-r from-accent to-success"
            style={{ transform: `scaleX(${Math.max(0.03, journey.progress)})` }}
          />
        </span>
        <span className="mt-1 block truncate text-xs text-muted">
          {next && journey.next ? j.next(next, journey.next.level) : j.summit}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted" />
    </Link>
  )
}
