import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  Armchair,
  BicepsFlexed,
  Building2,
  ChevronLeft,
  Flame,
  Footprints,
  House,
  Mars,
  PersonStanding,
  RefreshCw,
  Sprout,
  Target,
  Trophy,
  Venus,
  Zap,
  Columns2,
  Columns3,
  Layers,
  LayoutGrid,
  Rabbit,
  Turtle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { previewPlan, profileService } from '@/services/local-data'
import { recommendedSplit } from '@/domain/routine-generator'
import { bmi } from '@/domain/body-metrics'
import { formatDecimal } from '@/domain/numbers'
import { Tip } from '@/components/ui/tip'
import { useLocalProfile } from '@/features/profile/hooks'
import type {
  ActivityLevel,
  Experience,
  Goal,
  OnboardingAnswers,
  Sex,
  TrainingPlace,
  SplitStyle,
} from '@/types/models'
import { OptionCard } from './OptionCard'
import { UnitField } from './UnitField'
import { MacroTiles } from '@/features/nutrition/MacroTiles'
import { MetricsGrid } from '@/features/nutrition/MetricsGrid'

type Draft = Partial<Omit<OnboardingAnswers, 'targetWeightKg'>> & { targetWeightKg?: number | null }

const STEPS = [
  'welcome',
  'name',
  'sex',
  'body',
  'goal',
  'target',
  'activity',
  'experience',
  'days',
  'split',
  'legs',
  'duration',
  'place',
  'summary',
] as const
type Step = (typeof STEPS)[number]

const o = t.onboarding
const L = t.labels

const inRange = (v: number | null | undefined, min: number, max: number) =>
  typeof v === 'number' && v >= min && v <= max

/** Devuelve el error del paso, o null si se puede seguir. */
function validate(step: Step, d: Draft): string | null {
  switch (step) {
    case 'name':
      return d.name?.trim() ? null : o.errors.name
    case 'sex':
      return d.sex ? null : ''
    case 'body':
      if (!inRange(d.age, 14, 90)) return o.errors.age
      if (!inRange(d.heightCm, 120, 230)) return o.errors.height
      if (!inRange(d.weightKg, 35, 250)) return o.errors.weight
      return null
    case 'target':
      return d.targetWeightKg == null || inRange(d.targetWeightKg, 35, 250) ? null : o.errors.target
    case 'goal':
      return d.goal ? null : ''
    case 'activity':
      return d.activity ? null : ''
    case 'experience':
      return d.experience ? null : ''
    case 'days':
      return inRange(d.daysPerWeek, 2, 6) ? null : o.errors.days
    case 'split':
      return d.split ? null : ''
    case 'legs':
      return d.easeLegs === undefined ? '' : null
    case 'duration':
      return d.sessionMinutes ? null : ''
    case 'place':
      return d.place ? null : ''
    default:
      return null
  }
}

const isComplete = (d: Draft): d is OnboardingAnswers => STEPS.every((s) => validate(s, d) === null)

export function OnboardingPage() {
  const navigate = useNavigate()
  const existing = useLocalProfile()
  // Si se rehace el cuestionario, arranca con las respuestas anteriores y sin la bienvenida.
  const [draft, setDraft] = useState<Draft>(() => ({ sessionMinutes: 60, place: 'gym' }))
  const [loadedExisting, setLoadedExisting] = useState(false)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (existing && !loadedExisting) {
    setLoadedExisting(true)
    setDraft({ ...existing })
    setIndex(1)
  }

  const step = STEPS[index]!
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setError(null)
  }

  const go = (delta: number) => {
    setDirection(delta)
    setError(null)
    setIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)))
  }

  const next = () => {
    const problem = validate(step, draft)
    if (problem !== null) {
      setError(problem || null)
      return
    }
    go(1)
  }

  /** Para preguntas de opción única: elegir avanza solo. */
  const choose = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    set(key, value)
    window.setTimeout(() => go(1), 180)
  }

  const suggestedSplit = recommendedSplit(
    draft.experience ?? 'intermediate',
    draft.daysPerWeek ?? 3,
  )
  const bmiValue = draft.weightKg && draft.heightCm ? bmi(draft.weightKg, draft.heightCm) : null
  const goalTip =
    bmiValue === null
      ? null
      : o.tips.goal(
          formatDecimal(bmiValue, 1),
          bmiValue < 20 ? o.tips.goalLow : bmiValue >= 27 ? o.tips.goalHigh : o.tips.goalMid,
        )
  const targetWeeks =
    draft.targetWeightKg && draft.weightKg
      ? Math.ceil(
          Math.abs(draft.targetWeightKg - draft.weightKg) /
            (draft.targetWeightKg > draft.weightKg ? 0.35 : draft.weightKg * 0.0075),
        )
      : null

  const plan = useMemo(() => (isComplete(draft) ? previewPlan(draft) : null), [draft])

  const finish = async () => {
    if (!isComplete(draft)) return
    setSaving(true)
    try {
      await profileService.completeOnboarding({
        ...draft,
        name: draft.name.trim(),
        targetWeightKg: draft.targetWeightKg ?? null,
      })
      toast.success(t.onboarding.summaryTitle)
      navigate('/', { replace: true })
    } catch (e) {
      console.error(e)
      toast.error(t.auth.errors.unknown)
      setSaving(false)
    }
  }

  const questionCount = STEPS.length - 2 // sin bienvenida ni resumen
  const showChrome = step !== 'welcome'
  const progress = Math.min(1, index / (STEPS.length - 1))
  const autoAdvance = [
    'sex',
    'goal',
    'activity',
    'experience',
    'days',
    'split',
    'legs',
    'duration',
    'place',
  ].includes(step)

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden pt-safe">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-accent/12 blur-[110px]"
      />

      {showChrome && (
        <header className="relative mx-auto flex w-full max-w-md items-center gap-3 px-4 pt-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index <= 1 && !!existing}
            aria-label={t.common.back}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:text-fg disabled:opacity-0"
          >
            <ChevronLeft className="size-6" />
          </button>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-2">
            <motion.div
              className="h-full origin-left rounded-full bg-accent"
              initial={false}
              animate={{ scaleX: progress }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="min-w-12 shrink-0 text-right num text-sm whitespace-nowrap text-muted">
            {step === 'summary' ? '' : o.step(Math.min(index, questionCount), questionCount)}
          </span>
        </header>
      )}

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.section
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -28 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col pt-8 pb-6"
          >
            {step === 'welcome' && (
              <div className="flex flex-1 flex-col justify-center">
                <Logo className="mb-10 size-14" />
                <h1 className="text-[2.1rem] leading-tight font-bold tracking-tight">
                  {o.welcomeTitle}
                </h1>
                <p className="mt-4 text-[1.05rem] leading-relaxed text-muted">{o.welcomeBody}</p>
              </div>
            )}

            {step === 'name' && (
              <Question title={o.nameQ}>
                <Input
                  autoFocus
                  value={draft.name ?? ''}
                  onChange={(e) => set('name', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                  maxLength={60}
                  autoComplete="given-name"
                  enterKeyHint="next"
                  className="h-16 text-xl"
                  aria-label={o.nameQ}
                />
              </Question>
            )}

            {step === 'sex' && (
              <Question title={o.sexQ} hint={o.sexHint}>
                <Options>
                  {(['male', 'female'] as Sex[]).map((v) => (
                    <OptionCard
                      key={v}
                      icon={v === 'male' ? Mars : Venus}
                      title={L.sex[v]}
                      selected={draft.sex === v}
                      onSelect={() => choose('sex', v)}
                    />
                  ))}
                </Options>
              </Question>
            )}

            {step === 'body' && (
              <Question title={o.bodyQ} hint={o.bodyHint}>
                <div className="space-y-4">
                  <UnitField
                    label={o.age}
                    unit={o.years}
                    kind="integer"
                    value={draft.age ?? null}
                    onChange={(v) => set('age', v ?? undefined)}
                    autoFocus
                  />
                  <UnitField
                    label={o.height}
                    unit={t.units.cm}
                    value={draft.heightCm ?? null}
                    onChange={(v) => set('heightCm', v ?? undefined)}
                  />
                  <UnitField
                    label={o.weight}
                    unit={t.units.kg}
                    value={draft.weightKg ?? null}
                    onChange={(v) => set('weightKg', v ?? undefined)}
                  />
                </div>
              </Question>
            )}

            {step === 'goal' && (
              <Question title={o.goalQ}>
                <Options>
                  {(
                    [
                      ['muscle', BicepsFlexed],
                      ['fat_loss', Flame],
                      ['recomp', RefreshCw],
                      ['strength', Trophy],
                    ] as const
                  ).map(([v, icon]) => (
                    <OptionCard
                      key={v}
                      icon={icon}
                      title={L.goal[v as Goal]}
                      description={L.goalHint[v as Goal]}
                      selected={draft.goal === v}
                      onSelect={() => choose('goal', v)}
                    />
                  ))}
                </Options>
                {goalTip && <Tip className="mt-5">{goalTip}</Tip>}
              </Question>
            )}

            {step === 'target' && (
              <Question title={o.targetQ} hint={o.targetHint}>
                <UnitField
                  label={o.targetWeight}
                  unit={t.units.kg}
                  value={draft.targetWeightKg ?? null}
                  onChange={(v) => set('targetWeightKg', v)}
                  autoFocus
                />
                <Tip className="mt-5">
                  {o.tips.target}
                  {targetWeeks ? ` ${o.tips.targetWeeks(targetWeeks)}` : ''}
                </Tip>
              </Question>
            )}

            {step === 'activity' && (
              <Question title={o.activityQ}>
                <Options>
                  {(
                    [
                      ['sedentary', Armchair],
                      ['light', Footprints],
                      ['active', PersonStanding],
                      ['very_active', Zap],
                    ] as const
                  ).map(([v, icon]) => (
                    <OptionCard
                      key={v}
                      icon={icon}
                      title={L.activity[v as ActivityLevel]}
                      description={L.activityHint[v as ActivityLevel]}
                      selected={draft.activity === v}
                      onSelect={() => choose('activity', v)}
                    />
                  ))}
                </Options>
                <Tip className="mt-5">{o.tips.activity}</Tip>
              </Question>
            )}

            {step === 'experience' && (
              <Question title={o.experienceQ}>
                <Options>
                  {(
                    [
                      ['beginner', Sprout],
                      ['intermediate', Target],
                      ['advanced', Trophy],
                    ] as const
                  ).map(([v, icon]) => (
                    <OptionCard
                      key={v}
                      icon={icon}
                      title={L.experience[v as Experience]}
                      description={L.experienceHint[v as Experience]}
                      selected={draft.experience === v}
                      onSelect={() => choose('experience', v)}
                    />
                  ))}
                </Options>
                <Tip className="mt-5">{o.tips.experience}</Tip>
              </Question>
            )}

            {step === 'days' && (
              <Question title={o.daysQ} hint={o.daysHint}>
                <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={o.daysQ}>
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={draft.daysPerWeek === n}
                      aria-label={o.daysValue(n)}
                      onClick={() => choose('daysPerWeek', n)}
                      className={cn(
                        'h-20 rounded-2xl border num text-2xl font-bold transition-[transform,background-color,border-color,color] duration-150 active:scale-95',
                        draft.daysPerWeek === n
                          ? 'border-accent bg-accent text-accent-fg'
                          : 'border-border bg-card text-muted',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <Tip className="mt-6">{o.tips.days}</Tip>
              </Question>
            )}

            {step === 'split' && (
              <Question title={o.splitQ}>
                <Options>
                  {(
                    [
                      ['classic', Columns3],
                      ['ppl', Layers],
                      ['upper_lower', Columns2],
                      ['full_body', LayoutGrid],
                    ] as const
                  ).map(([v, icon]) => (
                    <OptionCard
                      key={v}
                      icon={icon}
                      title={L.split[v as SplitStyle]}
                      description={L.splitHint[v as SplitStyle]}
                      badge={v === suggestedSplit ? o.recommended : undefined}
                      selected={draft.split === v}
                      onSelect={() => choose('split', v)}
                    />
                  ))}
                </Options>
                <Tip className="mt-5">{o.tips.split(L.split[suggestedSplit])}</Tip>
              </Question>
            )}

            {step === 'legs' && (
              <Question title={o.legsQ}>
                <Options>
                  <OptionCard
                    icon={Rabbit}
                    title={o.legsYes}
                    description={o.legsYesHint}
                    selected={draft.easeLegs === false}
                    onSelect={() => choose('easeLegs', false)}
                  />
                  <OptionCard
                    icon={Turtle}
                    title={o.legsNo}
                    description={o.legsNoHint}
                    selected={draft.easeLegs === true}
                    onSelect={() => choose('easeLegs', true)}
                  />
                </Options>
                <Tip className="mt-5">{o.tips.legs}</Tip>
              </Question>
            )}

            {step === 'duration' && (
              <Question title={o.durationQ}>
                <div className="grid grid-cols-2 gap-3" role="radiogroup">
                  {[45, 60, 75, 90].map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={draft.sessionMinutes === m}
                      onClick={() => choose('sessionMinutes', m)}
                      className={cn(
                        'h-20 rounded-2xl border num text-xl font-semibold transition-[transform,background-color,border-color] duration-150 active:scale-[0.97]',
                        draft.sessionMinutes === m
                          ? 'border-accent/70 bg-accent/12 text-fg'
                          : 'border-border bg-card text-muted',
                      )}
                    >
                      {o.minutes(m)}
                    </button>
                  ))}
                </div>
                <Tip className="mt-6">{o.tips.duration}</Tip>
              </Question>
            )}

            {step === 'place' && (
              <Question title={o.placeQ}>
                <Options>
                  {(
                    [
                      ['gym', Building2],
                      ['home', House],
                    ] as const
                  ).map(([v, icon]) => (
                    <OptionCard
                      key={v}
                      icon={icon}
                      title={L.place[v as TrainingPlace]}
                      description={L.placeHint[v as TrainingPlace]}
                      selected={draft.place === v}
                      onSelect={() => choose('place', v)}
                    />
                  ))}
                </Options>
              </Question>
            )}

            {step === 'summary' && plan && (
              <div>
                <h1 className="text-[1.9rem] leading-tight font-bold tracking-tight">
                  {o.summaryTitle}
                </h1>
                <p className="mt-2 text-muted">{o.summaryBody}</p>

                <section className="mt-7 rounded-[var(--radius-card)] border border-accent/35 bg-[radial-gradient(120%_120%_at_0%_0%,rgb(139_92_246/0.25),transparent_60%),var(--color-card)] p-5">
                  <p className="text-sm font-medium text-muted">{o.dailyTarget}</p>
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <AnimatedNumber
                      value={plan.macros.kcal}
                      className="text-[2.6rem] leading-none font-bold"
                    />
                    <span className="text-muted">{t.units.kcal}</span>
                  </p>
                  <MacroTiles macros={plan.macros} className="mt-5" />
                </section>

                <h2 className="mt-7 mb-3 text-sm font-medium text-muted">{o.metrics}</h2>
                <MetricsGrid metrics={plan.metrics} />

                <h2 className="mt-7 mb-1 text-sm font-medium text-muted">{o.yourRoutines}</h2>
                <p className="mb-3 text-xs text-subtle">{t.workouts.rotation}</p>
                <ul className="space-y-2.5">
                  {plan.routines.map((r, i) => (
                    <li
                      key={r.name}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-sm font-semibold text-accent-2">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{r.name}</span>
                        <span className="block truncate text-sm text-muted">{r.description}</span>
                      </span>
                      <span className="shrink-0 num text-sm text-muted">
                        {r.exercises.length} ej.
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs leading-relaxed text-subtle">{o.estimateNote}</p>
                <p className="mt-2 text-xs leading-relaxed text-subtle">{o.metricsNote}</p>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      {/* Acción fija abajo, con el error justo encima (siempre visible). */}
      <footer className="relative mx-auto w-full max-w-md px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 text-center text-sm text-danger"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        {step === 'welcome' && (
          <Button size="lg" block onClick={() => go(1)}>
            {o.start}
          </Button>
        )}
        {step === 'summary' && (
          <Button size="lg" block onClick={() => void finish()} loading={saving}>
            {saving ? o.saving : o.createPlan}
          </Button>
        )}
        {step !== 'welcome' && step !== 'summary' && !autoAdvance && (
          <div className="flex gap-3">
            {step === 'target' && (
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  set('targetWeightKg', null)
                  go(1)
                }}
              >
                {o.skip}
              </Button>
            )}
            <Button size="lg" className="flex-1" onClick={next}>
              {o.next}
            </Button>
          </div>
        )}
        {autoAdvance && validate(step, draft) === null && (
          <Button size="lg" block onClick={next}>
            {o.next}
          </Button>
        )}
      </footer>
    </div>
  )
}

function Question({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">{title}</h1>
      {hint && <p className="mt-2 text-[0.95rem] text-muted">{hint}</p>}
      <div className="mt-7">{children}</div>
    </div>
  )
}

function Options({ children }: { children: ReactNode }) {
  return (
    <div role="radiogroup" className="space-y-3">
      {children}
    </div>
  )
}
