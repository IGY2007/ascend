import { useState } from 'react'
import {
  Activity,
  Bike,
  Footprints,
  Goal,
  HeartPulse,
  Repeat2,
  Ship,
  Timer,
  Trophy,
  Volleyball,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { useLatestWeight, useLocalProfile } from '@/features/profile/hooks'
import { cardioService } from '@/services/activity'
import { cardioKcal, type CardioActivity, type Intensity } from '@/domain/cardio'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const c = t.cardio
const ACTIVITIES: [CardioActivity, LucideIcon][] = [
  ['football', Goal],
  ['cycling', Bike],
  ['running', Footprints],
  ['walking', Footprints],
  ['swimming', Waves],
  ['padel', Trophy],
  ['basketball', Volleyball],
  ['hiit', HeartPulse],
  ['elliptical', Repeat2],
  ['rowing', Ship],
  ['jump_rope', Timer],
  ['other', Activity],
]
const MINUTES = [15, 30, 45, 60, 90]

/** Registrar cardio: actividad, duración e intensidad. Las calorías se suman al objetivo de hoy. */
export function CardioSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const latest = useLatestWeight()
  const profile = useLocalProfile()
  const weight = latest?.weightKg ?? profile?.weightKg ?? 70
  const [activity, setActivity] = useState<CardioActivity>('football')
  const [minutes, setMinutes] = useState<number | null>(60)
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const kcal = minutes ? cardioKcal(activity, intensity, minutes, weight) : 0
  const valid = minutes !== null && minutes >= 1 && minutes <= 600

  const save = async () => {
    if (!valid) return
    const saved = await cardioService.log({ activity, intensity, minutes: minutes! })
    toast.success(c.saved(formatDecimal(saved, 0)))
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={c.title} description={c.hint}>
      <div className="space-y-5 pt-1">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted">{c.activity}</legend>
          <div className="grid grid-cols-4 gap-2" role="radiogroup">
            {ACTIVITIES.map(([a, Icon]) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={activity === a}
                onClick={() => setActivity(a)}
                className={cn(
                  'flex h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 text-[0.72rem] font-medium transition-[transform,background-color,border-color] active:scale-95',
                  activity === a
                    ? 'border-accent/70 bg-accent/14 text-fg'
                    : 'border-border bg-card text-muted',
                )}
              >
                <Icon className="size-5" />
                <span className="truncate">{c.activities[a]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted">{c.duration}</legend>
          <div className="flex gap-1.5">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={minutes === m}
                onClick={() => setMinutes(m)}
                className={cn(
                  'h-11 flex-1 rounded-xl border num text-sm font-semibold transition-colors',
                  minutes === m
                    ? 'border-accent/70 bg-accent/14 text-fg'
                    : 'border-border text-muted',
                )}
              >
                {m}′
              </button>
            ))}
          </div>
          <label className="mt-2 flex items-center gap-3">
            <span className="text-sm text-muted">{c.minutes}</span>
            <NumberInput
              kind="integer"
              value={minutes}
              onValueChange={setMinutes}
              className="h-12 flex-1"
              aria-label={c.minutes}
            />
          </label>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted">{c.intensity}</legend>
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-card p-1" role="radiogroup">
            {(['light', 'moderate', 'vigorous'] as Intensity[]).map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={intensity === i}
                onClick={() => setIntensity(i)}
                className={cn(
                  'h-11 rounded-xl text-sm font-semibold transition-colors',
                  intensity === i ? 'bg-accent text-accent-fg' : 'text-muted',
                )}
              >
                {c.intensities[i]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-center">
          <p className="num text-2xl font-bold">{c.estimate(formatDecimal(kcal, 0))}</p>
          <p className="mt-0.5 text-xs text-subtle">{c.estimateNote}</p>
        </div>

        <Button size="lg" block disabled={!valid} onClick={() => void save()}>
          {c.save}
        </Button>
      </div>
    </Sheet>
  )
}
