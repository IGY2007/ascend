import { Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tip } from '@/components/ui/tip'
import { useGameState } from '@/features/profile/hooks'
import {
  laggingStat,
  physiqueLevel,
  setsForMuscleLevel,
  type MuscleStat,
  type Readiness,
} from '@/domain/gamification'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const m = t.game.muscles

const READY_STYLE: Record<Readiness, string> = {
  ready: 'bg-success/15 text-success',
  recovering: 'bg-accent/15 text-accent-2',
  cold: 'bg-warning/12 text-warning',
  untrained: 'bg-card-2 text-subtle',
}

/**
 * La ficha del físico, estilo RPG: cada grupo muscular sube de nivel con las series que hacés,
 * con un radar del equilibrio general y el estado de recuperación de cada uno.
 */
export function PhysiqueTab() {
  const game = useGameState()
  if (!game) return <Skeleton className="h-96 rounded-[var(--radius-card)]" />
  const stats = game.muscles
  const lagging = laggingStat(stats)

  return (
    <>
      <Card highlight className="pb-3">
        <p className="text-sm text-muted">{m.subtitle}</p>
        <p className="mt-1 text-xl font-bold">
          {m.overall(formatDecimal(physiqueLevel(stats), 1))}
        </p>
        <Radar stats={stats} />
      </Card>

      {lagging ? (
        <Tip className="mt-4">{m.lagging(m.stats[lagging.stat])}</Tip>
      ) : stats.some((s) => s.sets > 0) ? (
        <Tip className="mt-4">{m.balanced}</Tip>
      ) : null}

      <ul className="mt-5 space-y-2.5">
        {stats.map((s) => {
          const toNext = setsForMuscleLevel(s.level + 1) - s.sets
          return (
            <li key={s.stat}>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card-2 num text-sm font-bold">
                    {m.level(s.level)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{m.stats[s.stat]}</p>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[0.7rem] font-semibold',
                          READY_STYLE[s.readiness],
                        )}
                      >
                        {m.readiness[s.readiness]}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-card-2">
                      <div
                        className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-success transition-transform duration-700"
                        style={{ transform: `scaleX(${Math.max(0.02, s.progress)})` }}
                      />
                    </div>
                    <p className="mt-1.5 flex justify-between gap-2 num text-xs text-muted">
                      <span>{m.setsToNext(toNext)}</span>
                      <span>{m.weekSets(s.weekSets)}</span>
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      <p className="mt-4 flex gap-2 px-1 text-xs leading-relaxed text-subtle">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {m.weeklyTarget} {m.readyHint}
        </span>
      </p>
    </>
  )
}

/** Radar de una sola serie: el nivel de cada grupo, como la carta de un jugador. */
function Radar({ stats }: { stats: MuscleStat[] }) {
  const size = 300
  const c = size / 2
  const r = 92
  // Nivel continuo (con el avance hacia el próximo) para que se note la forma desde el principio
  const value = (s: MuscleStat) => (s.sets > 0 ? s.level - 1 + s.progress : 0)
  const max = Math.max(3, ...stats.map((s) => Math.ceil(value(s))))
  const angle = (i: number) => (Math.PI * 2 * i) / stats.length - Math.PI / 2
  const point = (i: number, v: number) => [
    c + Math.cos(angle(i)) * r * v,
    c + Math.sin(angle(i)) * r * v,
  ]
  const poly = stats.map((s, i) => point(i, Math.max(0.03, value(s) / max)).join(',')).join(' ')

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto mt-1 block w-full max-w-[320px]"
      role="img"
      aria-label={stats.map((s) => `${m.stats[s.stat]} ${m.level(s.level)}`).join(', ')}
    >
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--color-success)" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon
          key={k}
          points={stats.map((_, i) => point(i, k).join(',')).join(' ')}
          fill="none"
          className="stroke-border"
          strokeDasharray={k === 1 ? undefined : '2 4'}
        />
      ))}
      {stats.map((_, i) => {
        const [x, y] = point(i, 1)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="stroke-border" />
      })}
      <polygon
        points={poly}
        fill="url(#radar-fill)"
        stroke="var(--color-accent-2)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {stats.map((s, i) => {
        const [x, y] = point(i, Math.max(0.03, value(s) / max))
        return (
          <circle
            key={s.stat}
            cx={x}
            cy={y}
            r={4}
            fill={s.readiness === 'ready' ? 'var(--color-success)' : 'var(--color-accent-2)'}
            className="stroke-card"
            strokeWidth={2}
          />
        )
      })}
      {stats.map((s, i) => {
        const [x, y] = point(i, 1.22)
        return (
          <text
            key={s.stat}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted text-[11px] font-medium"
          >
            {m.stats[s.stat]} {s.level}
          </text>
        )
      })}
    </svg>
  )
}
