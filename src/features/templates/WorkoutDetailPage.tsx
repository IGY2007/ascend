import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronLeft, Clock, Copy, Pencil, Play, Plus, Trash2, Repeat2 } from 'lucide-react'
import { formatDecimal } from '@/domain/numbers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tip } from '@/components/ui/tip'
import { ExerciseThumbnail } from '@/features/exercises/ExerciseThumbnail'
import { ExercisePicker } from '@/features/exercises/ExercisePicker'
import { useNextTemplateId, useTemplates } from '@/features/profile/hooks'
import { useStartWorkout } from '@/features/workout/use-start-workout'
import { templatesService } from '@/services/local-data'
import { t } from '@/i18n'
import { EditItemSheet } from './EditItemSheet'
import { exerciseName, routineText } from '@/i18n/names'

const w = t.workouts

/** "60 kg" si todas las series tienen el mismo peso; si no, "60 · 62,5 · 65 kg". */
function weightsLabel(weights: (number | null)[] | undefined): string | null {
  const ws = (weights ?? []).filter((x): x is number => x !== null)
  if (ws.length === 0) return null
  const unique = [...new Set(ws)]
  return w.weightsSummary(
    unique.length === 1 ? formatDecimal(unique[0]!) : ws.map((x) => formatDecimal(x)).join(' · '),
  )
}

export function WorkoutDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const templates = useTemplates()
  const nextId = useNextTemplateId()
  const start = useStartWorkout()
  const tpl = templates?.find((x) => x.id === id)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const editingIndex = tpl?.items.findIndex((i) => i.id === editingId) ?? -1
  const editing = editingIndex >= 0 ? tpl!.items[editingIndex]! : null

  return (
    <>
      <Link
        to="/workouts"
        className="mb-4 -ml-2 inline-flex h-11 items-center gap-1 rounded-xl pr-3 pl-1 text-[0.95rem] font-medium text-muted hover:text-fg"
      >
        <ChevronLeft className="size-5" />
        {w.back}
      </Link>

      {templates === undefined ? (
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
      ) : !tpl ? (
        <p className="text-muted">{w.notFound}</p>
      ) : (
        <>
          <header className="mb-5">
            <div className="flex flex-wrap items-center gap-2">
              {tpl.id === nextId && <Badge tone="accent">{w.nextUp}</Badge>}
              {tpl.source === 'generated' && <Badge>{w.generated}</Badge>}
            </div>
            {name === null ? (
              <button
                type="button"
                onClick={() => setName(routineText(tpl.name))}
                className="group mt-3 flex items-center gap-2 text-left"
                aria-label={w.rename}
              >
                <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">
                  {routineText(tpl.name)}
                </h1>
                <Pencil className="size-4 shrink-0 text-subtle group-hover:text-fg" />
              </button>
            ) : (
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (name.trim()) await templatesService.update(tpl.id, { name: name.trim() })
                  setName(null)
                }}
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  maxLength={80}
                  className="text-lg font-semibold"
                />
                <Button type="submit" className="h-13">
                  {t.common.save}
                </Button>
              </form>
            )}
            {tpl.description && <p className="mt-1 text-muted">{routineText(tpl.description)}</p>}
          </header>

          <Button
            size="lg"
            block
            className="mb-5"
            disabled={tpl.items.length === 0}
            onClick={() => void start(tpl.id)}
          >
            <Play />
            {w.startThis}
          </Button>

          {tpl.notes && <Tip className="mb-4">{routineText(tpl.notes)}</Tip>}

          <p className="mb-3 flex items-center gap-2 px-1 text-sm text-muted">
            <Clock className="size-4 shrink-0" />
            {w.restRecommended}
          </p>

          {tpl.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              {w.emptyRoutine}
            </p>
          ) : (
            <ol className="space-y-2.5">
              {tpl.items.map((item, i) => {
                const ex = item.exercise
                const timed = ex?.exerciseType === 'timed'
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setEditingId(item.id)}
                      className="block w-full text-left transition-transform active:scale-[0.99]"
                    >
                      <Card className="flex items-center gap-3.5 p-3.5">
                        {ex && <ExerciseThumbnail exercise={ex} />}
                        <div className="min-w-0 flex-1">
                          <p className="leading-snug font-semibold">
                            <span className="mr-1.5 num text-subtle">{i + 1}.</span>
                            {exerciseName(ex, '—')}
                          </p>
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 num text-sm">
                            <span className="font-semibold text-fg">
                              {w.setsReps(
                                item.targetSets,
                                item.targetRepsMin,
                                item.targetRepsMax,
                                timed,
                              )}
                            </span>
                            {!timed && weightsLabel(item.targetWeights) && (
                              <span className="font-semibold text-accent-2">
                                {weightsLabel(item.targetWeights)}
                              </span>
                            )}
                            {item.targetRir !== null && (
                              <span className="text-muted">{w.rir(item.targetRir)}</span>
                            )}
                          </p>
                          {item.notes && (
                            <p className="mt-1 truncate text-xs text-subtle">{item.notes}</p>
                          )}
                        </div>
                        <Pencil className="size-4 shrink-0 text-subtle" />
                      </Card>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}

          <Button variant="secondary" block className="mt-3" onClick={() => setPickerOpen(true)}>
            <Plus />
            {w.addExercise}
          </Button>

          <Button
            variant="ghost"
            block
            size="sm"
            className="mt-6"
            onClick={() => void templatesService.setInRotation(tpl.id, tpl.inRotation === false)}
          >
            <Repeat2 />
            {tpl.inRotation === false ? w.addToRotation : w.removeFromRotation}
          </Button>
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={async () =>
                navigate(`/workouts/${await templatesService.duplicate(tpl.id)}`)
              }
            >
              <Copy />
              {w.duplicate}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-danger"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
              {w.deleteRoutine}
            </Button>
          </div>

          <EditItemSheet
            item={editing}
            isFirst={editingIndex === 0}
            isLast={editingIndex === tpl.items.length - 1}
            onClose={() => setEditingId(null)}
          />
          <ExercisePicker
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            onPick={(e) => void templatesService.addExercise(tpl.id, e.id)}
          />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={w.deleteRoutineTitle}
            description={w.deleteRoutineBody}
            confirmLabel={w.delete}
            destructive
            onConfirm={async () => {
              await templatesService.remove(tpl.id)
              navigate('/workouts', { replace: true })
            }}
          />
        </>
      )}
    </>
  )
}
