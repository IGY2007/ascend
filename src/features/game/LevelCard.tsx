import { Link } from 'react-router'
import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProgressRing } from '@/components/ui/progress-ring'
import { Skeleton } from '@/components/ui/skeleton'
import { useGameState } from '@/features/profile/hooks'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const g = t.game

/** Nivel, título y XP hacia el próximo nivel. */
export function LevelCard({ className }: { className?: string }) {
  const game = useGameState()
  if (!game) return <Skeleton className={cn('h-32 rounded-[var(--radius-card)]', className)} />
  const { level } = game
  return (
    <Card highlight className={cn('flex items-center gap-5', className)}>
      <ProgressRing value={level.into / level.needed} size={92} stroke={8}>
        <div>
          <p className="text-[0.65rem] font-medium tracking-wide text-muted uppercase">Lv</p>
          <p className="num text-3xl leading-none font-bold">{level.level}</p>
        </div>
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
          <Sparkles className="size-4" />
          {g.titles[level.title]}
        </p>
        <p className="mt-1 num text-lg font-bold">{g.xp(level.into, level.needed)}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{g.howXp}</p>
      </div>
    </Card>
  )
}

/** Chip compacto para el encabezado de Inicio. */
export function LevelChip() {
  const game = useGameState()
  if (!game) return null
  const { level } = game
  return (
    <Link
      to="/profile"
      className="flex h-11 items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1"
      aria-label={`${g.level(level.level)} · ${g.titles[level.title]}`}
    >
      <ProgressRing value={level.into / level.needed} size={34} stroke={3.5}>
        <span className="num text-xs font-bold">{level.level}</span>
      </ProgressRing>
      <span className="text-xs font-semibold text-fg">{g.titles[level.title]}</span>
    </Link>
  )
}
