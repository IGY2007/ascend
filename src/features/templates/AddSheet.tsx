import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Activity, ListPlus, Play, Plus, Shuffle, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNextTemplateId, useTemplates } from '@/features/profile/hooks'
import { useStartWorkout } from '@/features/workout/use-start-workout'
import { templatesService } from '@/services/local-data'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { routineText } from '@/i18n/names'

const w = t.workouts

/** El "+" de Entrenar: empezar la que toca, otra rutina, un entrenamiento libre o crear una rutina. */
export function AddSheet({
  open,
  onOpenChange,
  onCardio,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCardio: () => void
}) {
  const templates = useTemplates()
  const nextId = useNextTemplateId()
  const start = useStartWorkout()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'menu' | 'pick' | 'create'>('menu')
  const [name, setName] = useState('')
  const next = templates?.find((x) => x.id === nextId)

  const go = async (templateId: string | null) => {
    onOpenChange(false)
    await start(templateId)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setMode('menu')
          setName('')
        }
        onOpenChange(o)
      }}
      title={mode === 'create' ? w.createRoutine : mode === 'pick' ? w.startOther : w.addTitle}
    >
      {mode === 'menu' && (
        <div className="space-y-2.5 pt-1">
          {next && (
            <Action
              icon={Play}
              highlight
              title={w.startNext(routineText(next.name))}
              hint={w.startNextHint}
              onClick={() => void go(next.id)}
            />
          )}
          {templates && templates.length > 1 && (
            <Action
              icon={Shuffle}
              title={w.startOther}
              hint={w.startOtherHint}
              onClick={() => setMode('pick')}
            />
          )}
          <Action
            icon={Zap}
            title={w.startFree}
            hint={w.startFreeHint}
            onClick={() => void go(null)}
          />
          <Action
            icon={ListPlus}
            title={w.createRoutine}
            hint={w.createRoutineHint}
            onClick={() => setMode('create')}
          />
          <Action
            icon={Activity}
            title={w.cardio}
            hint={w.cardioHint}
            onClick={() => {
              onOpenChange(false)
              onCardio()
            }}
          />
        </div>
      )}

      {mode === 'pick' && (
        <ul className="space-y-2 pt-1">
          {templates?.map((tpl) => (
            <li key={tpl.id}>
              <button
                type="button"
                onClick={() => void go(tpl.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-transform active:scale-[0.99]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{routineText(tpl.name)}</span>
                  <span className="block num text-xs text-muted">
                    {t.home.exercises(tpl.items.length)}
                  </span>
                </span>
                <Play className="size-5 shrink-0 text-accent-2" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {mode === 'create' && (
        <form
          className="space-y-4 pt-1"
          onSubmit={async (e) => {
            e.preventDefault()
            const id = await templatesService.create(name || w.newRoutineDefault)
            onOpenChange(false)
            navigate(`/workouts/${id}`)
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-muted">{w.newRoutineName}</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={w.newRoutineDefault}
              maxLength={80}
              autoFocus
            />
          </label>
          <Button type="submit" size="lg" block>
            <Plus />
            {w.create}
          </Button>
        </form>
      )}
    </Sheet>
  )
}

function Action({
  icon: Icon,
  title,
  hint,
  onClick,
  highlight,
  disabled,
}: {
  icon: LucideIcon
  title: string
  hint?: string
  onClick?: () => void
  highlight?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-[transform,opacity] active:scale-[0.99] disabled:opacity-45',
        highlight ? 'border-accent/50 bg-accent/12' : 'border-border bg-card',
      )}
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl',
          highlight ? 'bg-accent text-accent-fg' : 'bg-card-2 text-muted',
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </button>
  )
}
