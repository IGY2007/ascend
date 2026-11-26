import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { Check, CheckCheck, ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Skeleton } from '@/components/ui/skeleton'
import { ExercisePicker } from '@/features/exercises/ExercisePicker'
import { useSessionView } from '@/features/profile/hooks'
import { workoutService } from '@/services/workout'
import { toDateKey } from '@/domain/dates'
import { t } from '@/i18n'
import { ExerciseBlock } from './ExerciseBlock'
import { routineText } from '@/i18n/names'

const es = t.editSession

/**
 * Corregir un entrenamiento ya hecho (o cargar uno de un día anterior): fecha, duración,
 * ejercicios y cada serie. Las series se guardan al instante; "Guardar" limpia las que quedaron
 * sin marcar y ajusta fecha y duración.
 */
export function EditSessionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const view = useSessionView(id)
  // Recién cargado desde el día: si se va sin marcar nada, no se guarda.
  const fresh = (useLocation().state as { fresh?: boolean } | null)?.fresh === true
  const [date, setDate] = useState<string | null>(null)
  const [minutes, setMinutes] = useState<number | null | undefined>(undefined)
  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'replace'; seId: string } | null>(
    null,
  )
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (view === undefined) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-5 pt-safe">
        <Skeleton className="mt-6 h-14" />
        <Skeleton className="h-72 rounded-[var(--radius-card)]" />
      </div>
    )
  }
  if (view === null) return <Navigate to="/progress" replace />
  if (view.status === 'in_progress') return <Navigate to={`/workout/${view.id}`} replace />

  const today = toDateKey(new Date())
  const currentDate = date ?? toDateKey(new Date(view.startedAt))
  const currentMinutes =
    minutes === undefined ? Math.round((view.durationSeconds ?? 0) / 60) || null : minutes

  const save = async (leaving = false) => {
    const result = await workoutService.saveEdits(
      view.id,
      { date: currentDate, durationMinutes: currentMinutes },
      { discardIfEmpty: fresh && leaving },
    )
    if (result === 'empty') {
      toast(es.needOne)
      return
    }
    toast.success(result === 'saved' ? es.saved : es.discarded)
    navigate(`/day/${currentDate}`, { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 pt-safe backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => void save(true)}
            aria-label={t.common.back}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:text-fg"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs font-medium text-muted">{es.title}</p>
            <p className="truncate font-semibold">{routineText(view.name)}</p>
          </div>
          <Button size="sm" onClick={() => void save()}>
            <Check />
            {t.common.done}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+3rem)]">
        <div className="grid grid-cols-2 gap-3">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-medium text-muted">{es.date}</span>
            <Input
              type="date"
              value={currentDate}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="h-12"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-medium text-muted">{es.durationMin}</span>
            <NumberInput
              kind="integer"
              value={currentMinutes}
              onValueChange={(v) => setMinutes(v === null ? null : Math.min(600, v))}
              className="h-12"
            />
          </label>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-subtle">{es.hint}</p>
        {view.exercises.some((e) => e.sets.some((x) => !x.isCompleted)) && (
          <Button
            variant="secondary"
            block
            className="mt-4"
            onClick={() => void workoutService.completeAll(view.id)}
          >
            <CheckCheck />
            {es.completeAll}
          </Button>
        )}

        {view.exercises.length === 0 ? (
          <p className="py-12 text-center text-muted">{es.empty}</p>
        ) : (
          <div className="mt-6 divide-y divide-border">
            {view.exercises.map((se, i) => (
              <div key={se.id} className="py-6 first:pt-0">
                <ExerciseBlock
                  se={se}
                  position={i}
                  total={view.exercises.length}
                  mode="edit"
                  onReplace={() => setPicker({ mode: 'replace', seId: se.id })}
                />
              </div>
            ))}
          </div>
        )}

        <Button
          variant="secondary"
          block
          className="mt-2"
          onClick={() => setPicker({ mode: 'add' })}
        >
          <Plus />
          {es.addExercise}
        </Button>
        <Button variant="primary" size="lg" block className="mt-3" onClick={() => void save()}>
          {es.save}
        </Button>
        <Button
          variant="ghost"
          block
          className="mt-6 text-danger"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 />
          {t.workout.deleteSession}
        </Button>
      </main>

      <ExercisePicker
        open={picker !== null}
        onOpenChange={(o) => !o && setPicker(null)}
        title={picker?.mode === 'replace' ? t.workout.replace : es.addExercise}
        onPick={async (e) => {
          if (picker?.mode === 'replace') await workoutService.replaceExercise(picker.seId, e.id)
          else await workoutService.addExercise(view.id, e.id)
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t.workout.deleteSessionTitle}
        description={t.workout.deleteSessionBody}
        confirmLabel={t.workouts.delete}
        destructive
        onConfirm={async () => {
          await workoutService.remove(view.id)
          toast.success(es.deleted)
          navigate(`/day/${currentDate}`, { replace: true })
        }}
      />
    </div>
  )
}
