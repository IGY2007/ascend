import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, CloudCheck, List, Plus, Trash2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import { ExercisePicker } from '@/features/exercises/ExercisePicker'
import { useSessionView } from '@/features/profile/hooks'
import { workoutService } from '@/services/workout'
import { formatDuration } from '@/domain/workout'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { RestTimer, type RestState } from './RestTimer'
import { Confetti } from '@/components/ui/confetti'
import { formatDecimal } from '@/domain/numbers'
import { ExerciseBlock } from './ExerciseBlock'
import { useWakeLock } from './use-wake-lock'
import { exerciseName, routineText } from '@/i18n/names'

const wk = t.workout
/** Descanso recomendado entre series: 2 a 2:30 min. El temporizador cuenta 2:30 (ajustable con ±15). */
const REST_SECONDS = 150

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
  const [record, setRecord] = useState<{ key: number; text: string; exercise: string } | null>(null)
  useWakeLock(true)

  // El cartel de récord se va solo
  useEffect(() => {
    if (!record) return
    const id = window.setTimeout(() => setRecord(null), 3200)
    return () => window.clearTimeout(id)
  }, [record])

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
            <p className="truncate text-xs font-medium text-muted">{routineText(view.name)}</p>
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
                onSetCompleted={() =>
                  setRest({ endsAt: Date.now() + REST_SECONDS * 1000, total: REST_SECONDS })
                }
                onRecord={(r) =>
                  setRecord({
                    key: Date.now(),
                    exercise: r.exercise,
                    text:
                      r.kind === 'weight'
                        ? wk.recordWeight(formatDecimal(r.value))
                        : wk.recordE1rm(formatDecimal(r.value, 1)),
                  })
                }
              />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Festejo de récord */}
      {record && <Confetti burstKey={record.key} />}
      <AnimatePresence>
        {record && (
          <motion.div
            key={record.key}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
            className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-gold/40 bg-card-2/95 px-4 py-3 shadow-[0_12px_40px_-12px_rgb(250_204_21/0.45)] backdrop-blur"
            role="status"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold text-gold-fg">
              <Trophy className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-success">{wk.newRecord}</span>
              <span className="block truncate text-sm text-fg">
                {record.text} · {record.exercise}
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abajo: descanso + navegación entre ejercicios, al alcance del pulgar */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-bg/90 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-xl">
        <div className="mx-auto max-w-lg space-y-2.5 px-4 pt-3">
          <RestTimer rest={rest} onChange={setRest} />
          {!rest && <p className="text-center text-xs text-muted">{wk.restRecommended}</p>}
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
                    {exerciseName(e.exercise, e.exerciseNameSnapshot)}
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
