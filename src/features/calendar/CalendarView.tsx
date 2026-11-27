import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { MonthRecap } from '@/features/game/MonthRecap'
import { useCalendarRange } from '@/features/profile/hooks'
import { monthGrid } from '@/services/calendar'
import { fromDateKey, toDateKey } from '@/domain/dates'
import { cn } from '@/lib/utils'
import { formatLongDate, formatMonthYear, t } from '@/i18n'

const c = t.calendar
// Semana de lunes a domingo
const WEEK_LETTERS = [1, 2, 3, 4, 5, 6, 0].map((d) => t.labels.weekdayLetter[d])

/** Mes en grilla: cada día muestra si entrenaste, hiciste cardio y cumpliste el agua. */
export function CalendarView() {
  const today = toDateKey(new Date())
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const cells = monthGrid(cursor.year, cursor.month)
  const days = useCalendarRange(cells[0]!.date, cells.at(-1)!.date)
  const isCurrentMonth =
    cursor.year === new Date().getFullYear() && cursor.month === new Date().getMonth()

  const move = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

  const inMonth = cells.filter((x) => x.inMonth).map((x) => days?.get(x.date))
  const workouts = inMonth.reduce((n, d) => n + (d?.workouts ?? 0), 0)
  const cardioDays = inMonth.filter((d) => (d?.cardioMinutes ?? 0) > 0).length

  return (
    <>
      <Card className="px-3 pt-3 pb-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label={c.prevMonth}
            className="grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="font-semibold first-letter:uppercase">
              {formatMonthYear(new Date(cursor.year, cursor.month, 1))}
            </p>
            <p className="num text-xs text-muted">{c.monthStats(workouts, cardioDays)}</p>
          </div>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={isCurrentMonth}
            aria-label={c.nextMonth}
            className="grid size-11 place-items-center rounded-xl text-muted hover:text-fg disabled:opacity-30"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-medium text-subtle">
          {WEEK_LETTERS.map((l, i) => (
            <span key={i} className="py-1">
              {l}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map(({ date, inMonth }) => {
            const info = days?.get(date)
            const trained = (info?.workouts ?? 0) > 0
            const cardio = (info?.cardioMinutes ?? 0) > 0
            const future = date > today
            const isToday = date === today
            const label = c.openDay(formatLongDate(fromDateKey(date)))
            const body = (
              <>
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-full num text-sm font-semibold transition-colors',
                    trained && 'bg-accent text-accent-fg',
                    !trained && isToday && 'text-fg ring-1 ring-accent-2',
                    !trained && !isToday && (inMonth ? 'text-fg/85' : 'text-subtle/60'),
                  )}
                >
                  {fromDateKey(date).getDate()}
                </span>
                <span className="flex h-1.5 items-center gap-1" aria-hidden>
                  {cardio && <span className="size-1.5 rounded-full bg-success" />}
                </span>
              </>
            )
            return future ? (
              <span
                key={date}
                className="flex h-12 flex-col items-center justify-center gap-1 opacity-35"
              >
                {body}
              </span>
            ) : (
              <Link
                key={date}
                to={`/day/${date}`}
                aria-label={label}
                className={cn(
                  'flex h-12 flex-col items-center justify-center gap-1 rounded-xl transition-colors hover:bg-card-2 active:bg-card-2',
                  !inMonth && 'opacity-50',
                )}
              >
                {body}
              </Link>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-accent" />
            {c.legendWorkout}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" />
            {c.legendCardio}
          </span>
        </div>
      </Card>
      <MonthRecap year={cursor.year} month={cursor.month} />
    </>
  )
}
