import { useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Pencil, Repeat, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import { ExercisePicker } from '@/features/exercises/ExercisePicker'
import { exercisesService, templatesService, type TemplateItem } from '@/services/local-data'
import { formatDecimal } from '@/domain/numbers'
import { t } from '@/i18n'

const w = t.workouts
const MAX_SETS = 20

interface Props {
  item: TemplateItem | null
  isFirst: boolean
  isLast: boolean
  onClose: () => void
}

/** Editar un ejercicio de la rutina: cambiarlo, renombrarlo, series, reps, kilos por serie, RIR y notas. */
export function EditItemSheet({ item, isFirst, isLast, onClose }: Props) {
  const [sets, setSets] = useState<number | null>(null)
  const [min, setMin] = useState<number | null>(null)
  const [max, setMax] = useState<number | null>(null)
  const [rir, setRir] = useState<number | null>(null)
  const [weights, setWeights] = useState<(number | null)[]>([])
  const [notes, setNotes] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  if (item && item.id !== loadedId) {
    setLoadedId(item.id)
    setSets(item.targetSets)
    setMin(item.targetRepsMin)
    setMax(item.targetRepsMax)
    setRir(item.targetRir)
    setWeights(item.targetWeights ?? [])
    setNotes(item.notes ?? '')
    setRenaming(null)
  }

  const timed = item?.exercise?.exerciseType === 'timed'
  const setCount = Math.min(MAX_SETS, Math.max(0, sets ?? 0))
  const valid =
    sets !== null &&
    sets >= 1 &&
    sets <= MAX_SETS &&
    min !== null &&
    max !== null &&
    min >= 1 &&
    max >= min

  const setWeight = (i: number, v: number | null) =>
    setWeights((prev) => {
      const next = [...prev]
      while (next.length <= i) next.push(null)
      next[i] = v
      return next
    })

  const save = async () => {
    if (!item || !valid) return
    const trimmed = Array.from({ length: setCount }, (_, i) => weights[i] ?? null)
    await templatesService.updateItem(item.id, {
      targetSets: sets,
      targetRepsMin: min,
      targetRepsMax: max,
      targetRir: rir,
      targetWeights: timed ? [] : trimmed,
      notes: notes.trim() || null,
    })
    toast.success(w.saved)
    onClose()
  }

  const rename = async () => {
    if (!item?.exercise || !renaming?.trim()) return
    const ex = item.exercise
    if (ex.ownerUserId) await exercisesService.updateCustom(ex.id, { name: renaming })
    else {
      // Los ejercicios de la biblioteca no se modifican: se crea una versión propia.
      const copy = await exercisesService.createCustom({
        name: renaming,
        primaryMuscle: ex.primaryMuscle,
        equipment: ex.equipment,
        exerciseType: ex.exerciseType,
      })
      await templatesService.updateItem(item.id, { exerciseId: copy.id })
    }
    setRenaming(null)
    toast.success(w.saved)
  }

  const field = (label: string, value: number | null, onChange: (v: number | null) => void) => (
    <label className="block min-w-0">
      <span className="mb-1.5 block truncate text-xs font-medium text-muted">{label}</span>
      <NumberInput kind="integer" value={value} onValueChange={onChange} className="h-12" />
    </label>
  )

  return (
    <>
      <Sheet open={item !== null} onOpenChange={(o) => !o && onClose()} title={w.editExercise}>
        {item && (
          <div className="space-y-5 pt-1">
            <div className="flex items-center gap-3">
              {item.exercise && <ExerciseThumbnail exercise={item.exercise} />}
              {renaming === null ? (
                <p className="min-w-0 flex-1 text-lg leading-snug font-semibold">
                  {item.exercise?.name}
                </p>
              ) : (
                <form
                  className="flex min-w-0 flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void rename()
                  }}
                >
                  <Input
                    value={renaming}
                    onChange={(e) => setRenaming(e.target.value)}
                    autoFocus
                    maxLength={80}
                    className="h-12"
                  />
                  <Button type="submit" className="h-12">
                    {t.common.save}
                  </Button>
                </form>
              )}
            </div>
            {renaming !== null && !item.exercise?.ownerUserId && (
              <p className="-mt-3 text-xs text-subtle">{w.renameHint}</p>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                <Repeat />
                {w.changeExercise}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRenaming(item.exercise?.name ?? '')}
              >
                <Pencil />
                {w.rename}
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {field(w.sets, sets, setSets)}
              {field(timed ? w.secondsMin : w.repsMin, min, setMin)}
              {field(timed ? w.secondsMax : w.repsMax, max, setMax)}
              {field(w.targetRir, rir, setRir)}
            </div>

            {/* Kilos por serie */}
            {!timed && setCount > 0 && (
              <fieldset>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <legend className="text-sm font-medium text-fg">{w.weightsTitle}</legend>
                  {setCount > 1 && weights[0] != null && (
                    <button
                      type="button"
                      onClick={() =>
                        setWeights(Array.from({ length: setCount }, () => weights[0] ?? null))
                      }
                      className="flex items-center gap-1 text-xs font-medium text-accent-2"
                    >
                      <Copy className="size-3.5" />
                      {w.weightsSameAll}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: setCount }, (_, i) => (
                    <label key={i} className="relative block">
                      <span className="pointer-events-none absolute top-1.5 left-3 text-[0.65rem] font-medium text-subtle">
                        {t.workout.set} {i + 1}
                      </span>
                      <NumberInput
                        value={weights[i] ?? null}
                        onValueChange={(v) => setWeight(i, v)}
                        placeholder={weights[i - 1] != null ? formatDecimal(weights[i - 1]!) : '—'}
                        aria-label={`${t.workout.kg} ${t.workout.set} ${i + 1}`}
                        className="h-14 pt-3 pr-8 text-lg"
                      />
                      <span className="pointer-events-none absolute right-3 bottom-3.5 text-xs text-muted">
                        {t.units.kg}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-subtle">{w.weightsHint}</p>
              </fieldset>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-muted">{w.notes}</span>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={w.notesPlaceholder}
                maxLength={500}
              />
            </label>

            <Button size="lg" block onClick={() => void save()} disabled={!valid}>
              {t.common.save}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                disabled={isFirst}
                onClick={() => void templatesService.moveItem(item.id, -1)}
              >
                <ArrowUp />
                {w.moveUp}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                disabled={isLast}
                onClick={() => void templatesService.moveItem(item.id, 1)}
              >
                <ArrowDown />
                {w.moveDown}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-danger"
                onClick={async () => {
                  await templatesService.removeItem(item.id)
                  onClose()
                }}
              >
                <Trash2 />
                {t.common.remove}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={w.changeExercise}
        onPick={(e) => item && void templatesService.updateItem(item.id, { exerciseId: e.id })}
      />
    </>
  )
}
