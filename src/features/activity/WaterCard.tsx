import { Droplet, Undo2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTodayWater, useWaterTarget } from '@/features/profile/hooks'
import { waterService } from '@/services/activity'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const w = t.water

/** Agua del día con suma rápida. */
export function WaterCard({ date }: { date: string }) {
  const total = useTodayWater(date) ?? 0
  const target = useWaterTarget() ?? 2500
  const pct = Math.min(1, total / target)
  const done = total >= target

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-baseline gap-1.5">
          <Droplet className={cn('size-5 self-center', done ? 'text-success' : 'text-accent-2')} />
          <span className="num text-3xl font-bold">{formatDecimal(total / 1000, 2)}</span>
          <span className="text-sm text-muted">{w.of(formatDecimal(target / 1000, 2))}</span>
        </p>
        {total > 0 && (
          <button
            type="button"
            onClick={() => void waterService.undoLast(date)}
            aria-label={w.undo}
            className="grid size-11 place-items-center rounded-xl text-subtle hover:text-fg"
          >
            <Undo2 className="size-4" />
          </button>
        )}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-card-2">
        <div
          className={cn(
            'h-full origin-left rounded-full transition-transform duration-500 ease-out-soft',
            done ? 'bg-success' : 'bg-accent',
          )}
          style={{ transform: `scaleX(${pct})` }}
        />
      </div>
      {done && <p className="mt-2 text-sm text-success">{w.done}</p>}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={total === 0}
          onClick={() => void waterService.setTotal(date, total - 250)}
          aria-label={w.remove(250)}
        >
          {w.remove(250)}
        </Button>
        {[250, 500, 750].map((ml) => (
          <Button
            key={ml}
            variant="secondary"
            size="sm"
            onClick={() => void waterService.add(ml, date)}
          >
            {w.add(ml)}
          </Button>
        ))}
      </div>
    </Card>
  )
}
