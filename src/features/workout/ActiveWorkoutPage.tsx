import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CloudCheck,
  List,
  Minus,
  Plus,
  Repeat,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { NumberInput } from '@/components/ui/number-input'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tip } from '@/components/ui/tip'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import { ExercisePicker } from '@/features/exercises/ExercisePicker'
import { useSessionView } from '@/features/profile/hooks'
import { workoutService, type SessionExerciseView } from '@/services/workout'
import { formatDuration, suggestIncrease } from '@/domain/workout'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import type { ExerciseSet } from '@/types/models'
import { RestTimer, type RestState } from './RestTimer'
import { useWakeLock } from './use-wake-lock'

const wk = t.workout

function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })
  const set = useCallback(
    (v: T) => {
      setValue(v)
      if (v === null) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(v))
    },
    [key],
  )
  return [value, set] as const
}

export function ActiveWorkoutPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const view = useSessionView(id)
  const [index, setIndex] = usePersistedState<number>(`ascend-workout-index-${id}`, 0)
  const [rest, setRest] = usePersistedState<RestState | null>('ascend-rest', null)
  const [now, setNow] = useState(() => Date.now())
  const [listOpen, setListOpen] = useState(false)
  const [pickerMode, setPickerMode] = useState<'add' | 'replace' | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  useWakeLock(true)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const timer = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  if (view === undefined) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-5 pt-safe">
        <Skeleton className="mt-6 h-14" />
        <Skeleton className="h-72 rounded-[var(--radius-card)]" />
      </div>
    )
  }
  if (view === null) return <Navigate to="/workouts" replace />
  if (view.status === 'completed') return <Navigate to={`/workout/${view.id}/summary`} replace />

  const exercises = view.exercises
  const current = exercises[Math.min(index, exercises.length - 1)]
  const safeIndex = Math.min(index, Math.max(0, exercises.length - 1))
  const elapsed = (now - new Date(view.startedAt).getTime()) / 1000
  const pending = exercises.reduce((n, e) => n + e.sets.filter((s) => !s.isCompleted).length, 0)
  const completedTotal = exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.isCompleted).length,
    0,
  )

  const finish = async () => {
    await workoutService.finish(view.id)
    setRest(null)
    localStorage.removeItem(`ascend-workout-index-${id}`)
    navigate(`/workout/${view.id}/summary`, { replace: true, state: { fresh: true } })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Encabezado: cronómetro total */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 pt-safe backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label={t.common.close}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:text-fg"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xs font-medium text-muted">{view.name}</p>
            <p className="num text-xl leading-tight font-bold" aria-label={wk.elapsed}>
              {formatDuration(elapsed)}
            </p>
          </div>
          <Button size="sm" onClick={() => setFinishOpen(true)} disabled={completedTotal === 0}>
            {wk.finish}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+11rem)]">
        {!current ? (
          <div className="py-16 text-center">
            <p className="text-muted">{wk.noExercises}</p>
            <Button className="mt-5" onClick={() => setPickerMode('add')}>
              <Plus />
              {t.workouts.addExercise}
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              <ExerciseBlock
                se={current}
                position={safeIndex}
                total={exercises.length}
                onOpenList={() => setListOpen(true)}
                onReplace={() => setPickerMode('replace')}
                onSetCompleted={(restSeconds) =>
                  restSeconds > 0 &&
                  setRest({ endsAt: Date.now() + restSeconds * 1000, total: restSeconds })
                }
              />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Abajo: descanso + navegación entre ejercicios, al alcance del pulgar */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-bg/90 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-xl">
        <div className="mx-auto max-w-lg space-y-2.5 px-4 pt-3">
          <RestTimer rest={rest} onChange={setRest} />
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              disabled={safeIndex === 0}
              onClick={() => setIndex(safeIndex - 1)}
            >
              <ChevronLeft />
              {wk.prev}
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="size-14 rounded-2xl"
              onClick={() => setListOpen(true)}
              aria-label={wk.list}
            >
              <List />
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={safeIndex >= exercises.length - 1}
              onClick={() => setIndex(safeIndex + 1)}
            >
              {wk.next}
              <ChevronRight />
            </Button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[0.7rem] text-subtle">
            <CloudCheck className="size-3.5" />
            {wk.saving}
          </p>
        </div>
      </footer>

      {/* Lista de ejercicios: saltar, agregar, descartar */}
      <Sheet open={listOpen} onOpenChange={setListOpen} title={wk.list}>
        <ol className="space-y-2 pt-1">
          {exercises.map((e, i) => {
            const done = e.sets.filter((s) => s.isCompleted).length
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    setIndex(i)
                    setListOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left',
                    i === safeIndex ? 'border-accent/50 bg-accent/10' : 'border-border bg-card',
                  )}
                >
                  {e.exercise && <ExerciseThumbnail exercise={e.exercise} className="size-10" />}
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {e.exerciseNameSnapshot}
                  </span>
                  <span
                    className={cn(
                      'num text-sm',
                      done === e.sets.length && done > 0 ? 'text-success' : 'text-muted',
                    )}
                  >
                    {done}/{e.sets.length}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <Button variant="secondary" block className="mt-3" onClick={() => setPickerMode('add')}>
          <Plus />
          {t.workouts.addExercise}
        </Button>
        <Button
          variant="ghost"
          block
          className="mt-6 text-danger"
          onClick={() => setDiscardOpen(true)}
        >
          <Trash2 />
          {wk.discard}
        </Button>
      </Sheet>

      <ExercisePicker
        open={pickerMode !== null}
        onOpenChange={(o) => !o && setPickerMode(null)}
        title={pickerMode === 'replace' ? wk.replace : t.workouts.addExercise}
        onPick={async (e) => {
          if (pickerMode === 'replace' && current)
            await workoutService.replaceExercise(current.id, e.id)
          else {
            await workoutService.addExercise(view.id, e.id)
            setIndex(exercises.length)
            setListOpen(false)
          }
        }}
      />

      <ConfirmDialog
        open={finishOpen}
        onOpenChange={setFinishOpen}
        title={wk.finishTitle}
        description={wk.finishBody(pending)}
        confirmLabel={wk.finish}
        onConfirm={() => void finish()}
      />
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={wk.discardTitle}
        description={wk.discardBody}
        confirmLabel={wk.discard}
        destructive
        onConfirm={async () => {
          await workoutService.discard(view.id)
          setRest(null)
          navigate('/workouts', { replace: true })
        }}
      />
    </div>
  )
}

function ExerciseBlock({
  se,
  position,
  total,
  onOpenList,
  onReplace,
  onSetCompleted,
}: {
  se: SessionExerciseView
  position: number
  total: number
  onOpenList: () => void
  onReplace: () => void
  onSetCompleted: (restSeconds: number) => void
}) {
  const type = se.exercise?.exerciseType ?? 'weighted'
  const timed = type === 'timed'
  const suggestion = suggestIncrease(se.previous, se.targetRepsMax)
  const repsPlaceholder = (i: number) =>
    timed
      ? (se.previous[i]?.durationSeconds ?? se.targetRepsMax)
      : (se.previous[i]?.repetitions ?? se.targetRepsMax)

  /** Peso sugerido: lo de la última vez en esa serie, o lo cargado en la serie de arriba. */
  const weightPlaceholder = (i: number): number | null => {
    const fromPrevious = se.previous[i]?.weightKg
    if (fromPrevious != null) return fromPrevious
    for (let j = i - 1; j >= 0; j--) {
      const w = se.sets[j]?.weightKg
      if (w != null) return w
    }
    return null
  }

  const toggle = async (set: ExerciseSet, i: number) => {
    const completing = !set.isCompleted
    const values: Partial<ExerciseSet> = {}
    if (completing) {
      // Si no escribió nada, acepta lo que se ve (objetivo o lo de la última vez).
      if (timed && set.durationSeconds === null) values.durationSeconds = repsPlaceholder(i) ?? null
      if (!timed && set.repetitions === null) values.repetitions = repsPlaceholder(i) ?? null
      if (set.weightKg === null && type === 'weighted') values.weightKg = weightPlaceholder(i)
    }
    await workoutService.toggleSet(set.id, values)
    if (completing) onSetCompleted(se.targetRestSeconds ?? 0)
  }

  const target =
    se.targetSets && se.targetRepsMin && se.targetRepsMax
      ? t.workouts.setsReps(se.targetSets, se.targetRepsMin, se.targetRepsMax, timed)
      : null

  return (
    <section>
      <button type="button" onClick={onOpenList} className="text-sm font-medium text-muted">
        {wk.exerciseOf(position + 1, total)}
      </button>
      <div className="mt-2 flex items-start gap-3.5">
        {se.exercise && <ExerciseThumbnail exercise={se.exercise} className="size-14" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.45rem] leading-tight font-bold tracking-tight">
            {se.exerciseNameSnapshot}
          </h1>
          <p className="mt-1 num text-sm text-muted">
            {[
              target && `${wk.target}: ${target}`,
              se.targetRir !== null && t.workouts.rir(se.targetRir),
              se.targetRestSeconds && t.workouts.rest(se.targetRestSeconds),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <button
          type="button"
          onClick={onReplace}
          aria-label={wk.replace}
          className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <Repeat className="size-5" />
        </button>
      </div>

      {se.notes && (
        <p className="mt-3 rounded-xl bg-card-2 px-3 py-2 text-sm text-muted">{se.notes}</p>
      )}

      <div className="mt-4 text-sm">
        {se.previous.length > 0 ? (
          <p className="num text-muted">
            <span className="font-medium text-fg">{wk.last}: </span>
            {se.previous
              .map((p) =>
                timed
                  ? `${p.durationSeconds ?? '—'} s`
                  : `${p.weightKg !== null ? formatDecimal(p.weightKg) : '—'} × ${p.repetitions ?? '—'}`,
              )
              .join(' · ')}
          </p>
        ) : (
          <p className="text-subtle">{wk.firstTime}</p>
        )}
      </div>
      {suggestion && <Tip className="mt-3">{wk.suggestion(formatDecimal(suggestion))}</Tip>}

      {/* Series: una fila por serie, todo en la misma pantalla */}
      <div className="mt-5">
        <div
          className={cn(
            'grid items-center gap-2 px-1 pb-2 text-xs font-medium text-subtle',
            timed ? 'grid-cols-[2rem_1fr_3.25rem]' : 'grid-cols-[2rem_1fr_1fr_3.5rem_3.25rem]',
          )}
        >
          <span>{wk.set}</span>
          {!timed && <span className="text-center">{wk.kg}</span>}
          <span className="text-center">{timed ? wk.secs : wk.reps}</span>
          {!timed && <span className="text-center">{wk.rir}</span>}
          <span />
        </div>
        <ul className="space-y-2">
          {se.sets.map((set, i) => (
            <li
              key={set.id}
              className={cn(
                'grid items-center gap-2 rounded-2xl p-1 transition-colors',
                timed ? 'grid-cols-[2rem_1fr_3.25rem]' : 'grid-cols-[2rem_1fr_1fr_3.5rem_3.25rem]',
                set.isCompleted && 'bg-success/8',
              )}
            >
              <span
                className={cn(
                  'text-center num font-semibold',
                  set.isCompleted ? 'text-success' : 'text-muted',
                )}
              >
                {set.setNumber}
              </span>
              {!timed && (
                <NumberInput
                  value={set.weightKg}
                  onValueChange={(v) => void workoutService.updateSet(set.id, { weightKg: v })}
                  placeholder={(() => {
                    const w = weightPlaceholder(i)
                    return w !== null ? formatDecimal(w) : '—'
                  })()}
                  aria-label={`${wk.kg} ${wk.set} ${set.setNumber}`}
                  className="h-12 px-1 text-lg"
                />
              )}
              <NumberInput
                kind="integer"
                value={timed ? set.durationSeconds : set.repetitions}
                onValueChange={(v) =>
                  void workoutService.updateSet(
                    set.id,
                    timed ? { durationSeconds: v } : { repetitions: v },
                  )
                }
                placeholder={String(repsPlaceholder(i) ?? '—')}
                aria-label={`${timed ? wk.secs : wk.reps} ${wk.set} ${set.setNumber}`}
                className="h-12 px-1 text-lg"
              />
              {!timed && (
                <NumberInput
                  kind="integer"
                  value={set.rir}
                  onValueChange={(v) =>
                    void workoutService.updateSet(set.id, {
                      rir: v === null ? null : Math.min(10, v),
                    })
                  }
                  placeholder={se.targetRir !== null ? String(se.targetRir) : '—'}
                  aria-label={`${wk.rir} ${wk.set} ${set.setNumber}`}
                  className="h-12 px-1 text-base"
                />
              )}
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => void toggle(set, i)}
                aria-pressed={set.isCompleted}
                aria-label={`${wk.done} ${wk.set} ${set.setNumber}`}
                className={cn(
                  'grid size-12 place-items-center rounded-xl border transition-colors',
                  set.isCompleted
                    ? 'border-success bg-success text-bg'
                    : 'border-border-strong text-muted',
                )}
              >
                {set.isCompleted ? (
                  <Check className="size-6" strokeWidth={3} />
                ) : (
                  <Check className="size-5 opacity-40" />
                )}
              </motion.button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => void workoutService.addSet(se.id)}
          >
            <Plus />
            {wk.addSet}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            disabled={se.sets.length === 0}
            onClick={() => {
              const last = se.sets.at(-1)
              if (last) void workoutService.removeSet(last.id)
            }}
          >
            <Minus />
            {wk.removeSet}
          </Button>
        </div>
        <button
          type="button"
          onClick={() => void workoutService.removeExercise(se.id)}
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 text-sm text-subtle hover:text-danger"
        >
          <X className="size-4" />
          {wk.remove}
        </button>
      </div>
    </section>
  )
}
