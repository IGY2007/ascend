import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useExerciseLibrary, useGameState } from '@/features/profile/hooks'
import { monthRecap, volumeEquivalent } from '@/domain/gamification'
import { formatDecimal } from '@/domain/numbers'
import { formatMonthYear, t } from '@/i18n'
import { exerciseName } from '@/i18n/names'

const r = t.game.recap

/** Resumen divertido del mes que se está mirando en el calendario. */
export function MonthRecap({ year, month }: { year: number; month: number }) {
  const game = useGameState()
  const library = useExerciseLibrary()
  if (!game) return null
  const rc = monthRecap(game.facts, year, month)
  const name = (id: string | null) =>
    id ? exerciseName(library?.find((e) => e.id === id)) || undefined : undefined
  const eq = volumeEquivalent(rc.volume)
  const monthName = formatMonthYear(new Date(year, month, 1))

  const tiles = [
    { label: r.workouts, value: String(rc.workouts) },
    { label: r.volume, value: `${formatDecimal(rc.volume / 1000, 1)} t` },
    { label: r.hours, value: formatDecimal(rc.minutes / 60, 1) },
    { label: r.prs, value: String(rc.prs) },
    { label: r.cardio, value: `${rc.cardioMinutes} ${t.charts.min}` },
    { label: r.sets, value: String(rc.sets) },
  ]

  return (
    <Card className="mt-4">
      <p className="flex items-center gap-2 font-semibold first-letter:uppercase">
        <Sparkles className="size-4 text-success" />
        {r.title(monthName)}
      </p>
      {rc.workouts === 0 ? (
        <p className="mt-2 text-sm text-muted">{r.empty}</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {tiles.map((x) => (
              <div key={x.label} className="rounded-2xl bg-bg-2/70 p-3">
                <p className="num text-lg font-bold">{x.value}</p>
                <p className="text-[0.7rem] leading-tight text-muted">{x.label}</p>
              </div>
            ))}
          </div>
          {eq && (
            <p className="mt-4 text-sm font-medium text-success">
              {r.equivalent(formatDecimal(eq.count, 1), r.things[eq.thing])}
            </p>
          )}
          <dl className="mt-3 space-y-3 text-sm">
            {name(rc.topExerciseId) && (
              <div>
                <dt className="text-xs text-muted">{r.topExercise}</dt>
                <dd className="font-medium">{name(rc.topExerciseId)}</dd>
              </div>
            )}
            {rc.bestLift && name(rc.bestLift.exerciseId) && (
              <div>
                <dt className="text-xs text-muted">{r.bestLift}</dt>
                <dd className="font-medium">
                  {name(rc.bestLift.exerciseId)} ·{' '}
                  <span className="num">{formatDecimal(rc.bestLift.e1rm, 1)} kg</span>
                </dd>
              </div>
            )}
          </dl>
        </>
      )}
    </Card>
  )
}
