import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricsGrid } from '@/features/nutrition/MetricsGrid'
import { bodyMetrics, profileService } from '@/services/local-data'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import type {
  ActivityLevel,
  EquipmentPref,
  Experience,
  Goal,
  Injury,
  OnboardingAnswers,
  Sex,
  SplitStyle,
  TrainingPlace,
} from '@/types/models'
import { useLatestWeight, useLocalProfile } from './hooks'

const ed = t.editData
const o = t.onboarding
const L = t.labels

/** Lo que cambia las rutinas: si se toca, se ofrece rearmarlas. */
const TRAINING_KEYS: (keyof OnboardingAnswers)[] = [
  'experience',
  'daysPerWeek',
  'split',
  'sessionMinutes',
  'place',
  'easeLegs',
  'injuries',
  'equipmentPref',
]

const INJURIES: Injury[] = ['shoulder', 'knee', 'lower_back', 'wrist_elbow']

/** "Mis datos": editar tu información sin rehacer el cuestionario. */
export function EditDataPage() {
  const navigate = useNavigate()
  const profile = useLocalProfile()
  const latest = useLatestWeight()
  const [patch, setPatch] = useState<Partial<OnboardingAnswers>>({})
  const [askRegenerate, setAskRegenerate] = useState(false)

  if (!profile) return <Skeleton className="h-96 rounded-[var(--radius-card)]" />
  const v = { ...profile, ...patch }
  const set = <K extends keyof OnboardingAnswers>(k: K, value: OnboardingAnswers[K]) =>
    setPatch((p) => ({ ...p, [k]: value }))
  const valid =
    v.name.trim().length > 0 &&
    v.age >= 14 &&
    v.age <= 90 &&
    v.heightCm >= 120 &&
    v.heightCm <= 230 &&
    (v.targetWeightKg == null || (v.targetWeightKg >= 35 && v.targetWeightKg <= 250))
  const changed = Object.keys(patch).length > 0
  const trainingChanged = TRAINING_KEYS.some(
    (k) => k in patch && JSON.stringify(patch[k]) !== JSON.stringify(profile[k]),
  )
  const metrics = bodyMetrics(v, latest?.weightKg ?? v.weightKg)

  const save = async (regenerate: boolean) => {
    await profileService.updateAnswers({ ...patch, name: v.name.trim() }, regenerate)
    toast.success(regenerate ? ed.regenerated : ed.saved)
    navigate(-1)
  }

  const chips = <T extends string | number>(
    value: T | undefined,
    options: readonly T[],
    label: (x: T) => string,
    onPick: (x: T) => void,
  ) => (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((x) => (
        <button
          key={String(x)}
          type="button"
          role="radio"
          aria-checked={value === x}
          onClick={() => onPick(x)}
          className={cn(
            'h-10 rounded-full border px-3.5 text-sm font-medium transition-colors',
            value === x
              ? 'border-accent bg-accent text-accent-fg'
              : 'border-border bg-card text-muted',
          )}
        >
          {label(x)}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <header className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t.common.back}
          className="-ml-2 grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">{ed.title}</h1>
      </header>

      <Group title={ed.personal}>
        <Field label={o.nameQ}>
          <Input value={v.name} onChange={(e) => set('name', e.target.value)} maxLength={60} />
        </Field>
        <Field label={o.sexQ}>
          {chips<Sex>(
            v.sex,
            ['male', 'female'],
            (x) => L.sex[x],
            (x) => set('sex', x),
          )}
        </Field>
        <div className="grid grid-cols-3 gap-2.5">
          <Field label={o.age}>
            <NumberInput
              kind="integer"
              value={v.age}
              onValueChange={(x) => x !== null && set('age', x)}
              className="h-12"
            />
          </Field>
          <Field label={`${o.height} (${t.units.cm})`}>
            <NumberInput
              value={v.heightCm}
              onValueChange={(x) => x !== null && set('heightCm', x)}
              className="h-12"
            />
          </Field>
          <Field label={`${o.targetWeight} (${t.units.kg})`}>
            <NumberInput
              value={v.targetWeightKg}
              onValueChange={(x) => set('targetWeightKg', x)}
              placeholder="—"
              className="h-12"
            />
          </Field>
        </div>
        <Field label={o.goalQ}>
          {chips<Goal>(
            v.goal,
            ['muscle', 'fat_loss', 'recomp', 'strength'],
            (x) => L.goal[x],
            (x) => set('goal', x),
          )}
        </Field>
        <Field label={o.activityQ}>
          {chips<ActivityLevel>(
            v.activity,
            ['sedentary', 'light', 'active', 'very_active'],
            (x) => L.activity[x],
            (x) => set('activity', x),
          )}
        </Field>
      </Group>

      <Group title={ed.training}>
        <Field label={o.experienceQ}>
          {chips<Experience>(
            v.experience,
            ['beginner', 'intermediate', 'advanced'],
            (x) => L.experience[x],
            (x) => set('experience', x),
          )}
        </Field>
        <Field label={o.daysQ}>
          {chips<number>(
            v.daysPerWeek,
            [2, 3, 4, 5, 6],
            (x) => o.daysValue(x),
            (x) => set('daysPerWeek', x),
          )}
        </Field>
        <Field label={o.splitQ}>
          {chips<SplitStyle>(
            v.split,
            ['full_body', 'upper_lower', 'ppl', 'classic'],
            (x) => L.split[x],
            (x) => set('split', x),
          )}
        </Field>
        <Field label={o.durationQ}>
          {chips<number>(
            v.sessionMinutes,
            [45, 60, 75, 90],
            (x) => o.minutes(x),
            (x) => set('sessionMinutes', x),
          )}
        </Field>
        <Field label={o.placeQ}>
          {chips<TrainingPlace>(
            v.place,
            ['gym', 'home'],
            (x) => L.place[x],
            (x) => set('place', x),
          )}
        </Field>
        <Field label={o.legsQ}>
          {chips<'yes' | 'no'>(
            v.easeLegs ? 'no' : 'yes',
            ['yes', 'no'],
            (x) => (x === 'yes' ? o.legsYes : o.legsNo),
            (x) => set('easeLegs', x === 'no'),
          )}
        </Field>
        <Field label={o.injuriesQ}>
          <div className="flex flex-wrap gap-2">
            {INJURIES.map((x) => {
              const on = !!v.injuries?.includes(x)
              return (
                <button
                  key={x}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    set(
                      'injuries',
                      on ? (v.injuries ?? []).filter((i) => i !== x) : [...(v.injuries ?? []), x],
                    )
                  }
                  className={cn(
                    'h-10 rounded-full border px-3.5 text-sm font-medium transition-colors',
                    on
                      ? 'border-accent bg-accent text-accent-fg'
                      : 'border-border bg-card text-muted',
                  )}
                >
                  {L.injury[x]}
                </button>
              )
            })}
          </div>
        </Field>
        <Field label={o.prefQ}>
          {chips<EquipmentPref>(
            v.equipmentPref ?? 'mixed',
            ['free', 'machines', 'mixed'],
            (x) => L.equipmentPref[x],
            (x) => set('equipmentPref', x),
          )}
        </Field>
      </Group>

      <Group title={o.metrics}>
        <MetricsGrid metrics={metrics} />
        <p className="px-1 text-xs leading-relaxed text-subtle">{o.metricsNote}</p>
      </Group>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] mt-6 md:bottom-4">
        <Button
          size="lg"
          block
          disabled={!changed || !valid}
          onClick={() => (trainingChanged ? setAskRegenerate(true) : void save(false))}
        >
          {t.common.save}
        </Button>
      </div>

      <ConfirmDialog
        open={askRegenerate}
        onOpenChange={setAskRegenerate}
        title={ed.regenerateTitle}
        description={ed.regenerateBody}
        confirmLabel={ed.regenerate}
        cancelLabel={ed.keep}
        onConfirm={() => void save(true)}
        onCancel={() => void save(false)}
      />
    </>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 space-y-4 first:mt-0">
      <h2 className="px-1 text-sm font-medium text-muted">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-1 text-xs font-medium text-muted">{label}</p>
      {children}
    </div>
  )
}
