import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useExerciseLibrary } from '@/features/profile/hooks'
import { exercisesService } from '@/services/local-data'
import { cn } from '@/lib/utils'
import { normalize } from '@/lib/text'
import { t } from '@/i18n'
import type { Equipment, Exercise, MuscleGroup } from '@/types/models'
import { ExerciseThumbnail } from './ExerciseThumbnail'

const MUSCLES: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'abs',
]
const EQUIPMENT: Equipment[] = [
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'smith',
  'other',
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (exercise: Exercise) => void
  title?: string
}

/** Buscar y elegir un ejercicio (o crear uno propio al vuelo, sin salir de la pantalla). */
export function ExercisePicker({ open, onOpenChange, onPick, title = t.picker.title }: Props) {
  const library = useExerciseLibrary()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null)
  const [creating, setCreating] = useState(false)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    return (library ?? []).filter(
      (e) =>
        (!muscle || e.primaryMuscle === muscle) &&
        (!q || normalize(e.name).includes(q) || (e.nameEs && normalize(e.nameEs).includes(q))),
    )
  }, [library, query, muscle])

  const pick = (e: Exercise) => {
    onPick(e)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setQuery('')
          setMuscle(null)
          setCreating(false)
        }
        onOpenChange(o)
      }}
      title={creating ? t.picker.createTitle : title}
      className="h-[92dvh]"
    >
      {creating ? (
        <CreateExerciseForm
          initialName={query}
          onCreated={pick}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <>
          <div className="sticky top-0 z-10 -mx-5 space-y-3 bg-bg-2 px-5 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-subtle" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.picker.search}
                className="pl-12"
                aria-label={t.picker.search}
                enterKeyHint="search"
              />
            </div>
            <div className="-mx-5 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-5 pb-1">
              <Chip active={muscle === null} onClick={() => setMuscle(null)}>
                {t.picker.all}
              </Chip>
              {MUSCLES.map((m) => (
                <Chip
                  key={m}
                  active={muscle === m}
                  onClick={() => setMuscle(muscle === m ? null : m)}
                >
                  {t.labels.muscle[m]}
                </Chip>
              ))}
            </div>
          </div>

          <Button variant="secondary" block className="mb-3" onClick={() => setCreating(true)}>
            <Plus />
            {t.picker.create}
          </Button>

          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t.picker.none}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {results.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => pick(e)}
                    className="flex w-full items-center gap-3 py-2.5 text-left transition-opacity active:opacity-60"
                  >
                    <ExerciseThumbnail exercise={e} className="size-11" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{e.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {[
                          e.primaryMuscle && t.labels.muscle[e.primaryMuscle],
                          e.equipment && t.labels.equipment[e.equipment],
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                    {e.ownerUserId && <Badge tone="accent">{t.picker.custom}</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Sheet>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors',
        active ? 'border-accent/60 bg-accent/16 text-accent-2' : 'border-border text-muted',
      )}
    >
      {children}
    </button>
  )
}

function CreateExerciseForm({
  initialName,
  onCreated,
  onCancel,
}: {
  initialName: string
  onCreated: (e: Exercise) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [timed, setTimed] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    const exercise = await exercisesService.createCustom({
      name,
      primaryMuscle: muscle,
      equipment,
      exerciseType: timed ? 'timed' : equipment === 'bodyweight' ? 'bodyweight' : 'weighted',
    })
    onCreated(exercise)
  }

  return (
    <form
      className="space-y-5 pt-1"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-muted">{t.picker.name}</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">{t.picker.muscle}</legend>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLES.map((m) => (
            <Chip key={m} active={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)}>
              {t.labels.muscle[m]}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">{t.picker.equipment}</legend>
        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT.map((q) => (
            <Chip
              key={q}
              active={equipment === q}
              onClick={() => setEquipment(equipment === q ? null : q)}
            >
              {t.labels.equipment[q]}
            </Chip>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-11 items-center gap-3 text-[0.95rem]">
        <input
          type="checkbox"
          checked={timed}
          onChange={(e) => setTimed(e.target.checked)}
          className="size-5 accent-[#8B5CF6]"
        />
        {t.picker.timed}
      </label>
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit" className="flex-1" disabled={!name.trim()}>
          {t.picker.save}
        </Button>
      </div>
    </form>
  )
}
