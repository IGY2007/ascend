import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Repeat, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import { ExercisePicker } from '@/features/exercises/ExercisePicker'
import { exercisesService, templatesService, type TemplateItem } from '@/services/local-data'
import { t } from '@/i18n'

const w = t.workouts

interface Props {
  item: TemplateItem | null
  isFirst: boolean
  isLast: boolean
  onClose: () => void
}

/** Editar un ejercicio de la rutina: cambiarlo, renombrarlo, series, reps, descanso, RIR y notas. */
export function EditItemSheet({ item, isFirst, isLast, onClose }: Props) {
  const [sets, setSets] = useState<number | null>(null)
  const [min, setMin] = useState<number | null>(null)
  const [max, setMax] = useState<number | null>(null)
  const [rest, setRest] = useState<number | null>(null)
  const [rir, setRir] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [renaming, setRenaming] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null>(null)

  if (item && item.id !== loadedId) {
    setLoadedId(item.id)
    setSets(item.targetSets)
    setMin(item.targetRepsMin)
    setMax(item.targetRepsMax)
    setRest(item.targetRestSeconds)
    setRir(item.targetRir)
    setNotes(item.notes ?? '')
    setRenaming(null)
  }

  const timed = item?.exercise?.exerciseType === 'timed'
  const valid =
    sets !== null &&
    sets >= 1 &&
    sets <= 20 &&
    min !== null &&
    max !== null &&
    min >= 1 &&
    max >= min &&
    rest !== null

  const save = async () => {
    if (!item || !valid) return
    await templatesService.updateItem(item.id, {
      targetSets: sets,
      targetRepsMin: min,
      targetRepsMax: max,
      targetRestSeconds: rest,
      targetRir: rir,
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

            <div className="grid grid-cols-3 gap-2.5">
              {field(w.sets, sets, setSets)}
              {field(timed ? `${w.seconds} mín.` : w.repsMin, min, setMin)}
              {field(timed ? `${w.seconds} máx.` : w.repsMax, max, setMax)}
              {field(w.restSeconds, rest, setRest)}
              {field(w.targetRir, rir, setRir)}
            </div>

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
