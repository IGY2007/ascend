import { motion } from 'motion/react'
import { Check, Minus, Plus, Repeat, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { Tip } from '@/components/ui/tip'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import { workoutService, type SessionExerciseView } from '@/services/workout'
import { e1rm, suggestIncrease } from '@/domain/workout'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import type { ExerciseSet } from '@/types/models'

const wk = t.workout

/**
 * Un ejercicio con sus series. `live`: durante el entrenamiento (muestra la última vez y la
 * sugerencia). `edit`: corrigiendo un entrenamiento ya hecho.
 */
export function ExerciseBlock({
  se,
  position,
  total,
  onOpenList,
  onReplace,
  onSetCompleted,
  onRecord,
  mode = 'live',
}: {
  se: SessionExerciseView
  position: number
  total: number
  onOpenList?: () => void
  onReplace: () => void
  onSetCompleted?: () => void
  /** Se llama cuando una serie supera lo mejor de siempre (solo en vivo) */
  onRecord?: (r: { kind: 'weight' | 'e1rm'; value: number; exercise: string }) => void
  mode?: 'live' | 'edit'
}) {
  const live = mode === 'live'

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

  /** ¿Esta serie supera lo mejor de siempre (otras sesiones + series ya hechas hoy)? */
  const checkRecord = (set: ExerciseSet, values: Partial<ExerciseSet>) => {
    if (!onRecord || se.best.weight <= 0) return // la primera vez no es récord
    const weight = values.weightKg ?? set.weightKg
    const reps = values.repetitions ?? set.repetitions
    if (weight == null || !reps) return
    const others = se.sets.filter((s) => s.isCompleted && s.id !== set.id && s.weightKg != null)
    const bestW = Math.max(se.best.weight, ...others.map((s) => s.weightKg!))
    const bestE = Math.max(
      se.best.e1rm,
      ...others.filter((s) => s.repetitions).map((s) => e1rm(s.weightKg!, s.repetitions!)),
    )
    const name = se.exerciseNameSnapshot
    if (weight > bestW) onRecord({ kind: 'weight', value: weight, exercise: name })
    else if (e1rm(weight, reps) > bestE + 0.05)
      onRecord({ kind: 'e1rm', value: e1rm(weight, reps), exercise: name })
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
    if (completing) {
      onSetCompleted?.()
      if (live && type === 'weighted') checkRecord(set, values)
    }
  }

  const target =
    se.targetSets && se.targetRepsMin && se.targetRepsMax
      ? t.workouts.setsReps(se.targetSets, se.targetRepsMin, se.targetRepsMax, timed)
      : null

  return (
    <section>
      {onOpenList ? (
        <button type="button" onClick={onOpenList} className="text-sm font-medium text-muted">
          {wk.exerciseOf(position + 1, total)}
        </button>
      ) : (
        <p className="text-sm font-medium text-muted">{wk.exerciseOf(position + 1, total)}</p>
      )}
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

      {live && (
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
            <p className="text-subtle">
              {se.sets.some((x) => x.weightKg !== null) ? wk.fromRoutine : wk.firstTime}
            </p>
          )}
        </div>
      )}
      {live && !suggestion && !timed && se.targetRepsMax && (
        <p className="mt-2 text-xs leading-relaxed text-subtle">
          {wk.progressRule(se.targetRepsMax)}
        </p>
      )}
      {live && suggestion && <Tip className="mt-3">{wk.suggestion(formatDecimal(suggestion))}</Tip>}

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
