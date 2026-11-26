import { Dices, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  BODIES,
  EXTRAS,
  EYES,
  EYEWEAR,
  FACIAL,
  HAIR_COLORS,
  HAIR_STYLES,
  HEADWEAR,
  OUTFITS_BY_BODY,
  SHIRT_COLORS,
  SHOES_COLORS,
  SHORTS_COLORS,
  SKINS,
  isUnlocked,
  randomAvatar,
  unlockOf,
  type AvatarConfig,
  type Progress,
  type Unlock,
} from '@/domain/avatar'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const av = t.avatar

function lockText(u: Unlock): string {
  switch (u.kind) {
    case 'level':
      return av.locked.level(u.level)
    case 'achievement':
      return av.locked.achievement(t.game.achievements[u.id]?.title ?? u.id)
    case 'pro':
      return av.locked.pro
    default:
      return ''
  }
}

/** Opciones del personaje. Lo bloqueado muestra candado (o PRO) y explica cómo se gana. */
export function AvatarEditor({
  value,
  onChange,
  progress,
}: {
  value: AvatarConfig
  onChange: (next: AvatarConfig) => void
  progress: Progress
}) {
  const set = <K extends keyof AvatarConfig>(key: K, v: AvatarConfig[K]) => {
    const u = unlockOf(key, v as string | number)
    if (!isUnlocked(u, progress)) {
      toast(lockText(u))
      return
    }
    const next = { ...value, [key]: v }
    // Al cambiar de cuerpo, la ropa tiene que existir para ese cuerpo
    if (key === 'body' && !OUTFITS_BY_BODY[next.body]?.includes(next.outfit)) next.outfit = 'tank'
    if (key === 'body' && next.body === 'female') next.facial = 'none'
    onChange(next)
  }
  const idx = (n: number) => Array.from({ length: n }, (_, i) => i)
  const swatch = (field: keyof AvatarConfig, label: string, colors: readonly string[]) => (
    <Swatches
      label={label}
      colors={colors}
      value={value[field] as number}
      locks={idx(colors.length).map((i) => unlockOf(field, i))}
      progress={progress}
      onPick={(i) => set(field, i as never)}
    />
  )
  const chips = <K extends keyof AvatarConfig>(
    field: K,
    label: string,
    options: readonly string[],
    labels: Record<string, string>,
  ) => (
    <Chips
      label={label}
      options={options}
      labels={labels}
      value={value[field] as string}
      locks={options.map((o) => unlockOf(field, o))}
      progress={progress}
      onPick={(v) => set(field, v as AvatarConfig[K])}
    />
  )

  return (
    <div className="space-y-5">
      <Button variant="secondary" size="sm" onClick={() => onChange(randomAvatar(progress))}>
        <Dices />
        {av.random}
      </Button>
      {chips('body', av.body, BODIES, av.bodies)}
      {swatch('skin', av.skin, SKINS)}
      {chips('hair', av.hair, HAIR_STYLES, av.hairStyles)}
      {value.hair !== 'bald' && swatch('hairColor', av.hairColor, HAIR_COLORS)}
      {chips('eyes', av.eyes, EYES, av.eyeStyles)}
      {value.body === 'male' && chips('facial', av.facial, FACIAL, av.facials)}
      {chips('outfit', av.outfit, OUTFITS_BY_BODY[value.body] ?? OUTFITS_BY_BODY.male, av.outfits)}
      {(value.outfit !== 'shirtless' || value.headwear === 'cap' || value.headwear === 'beanie') &&
        swatch('shirtColor', av.color, SHIRT_COLORS)}
      {swatch('shortsColor', av.shorts, SHORTS_COLORS)}
      {swatch('shoesColor', av.shoes, SHOES_COLORS)}
      {chips('headwear', av.headwear, HEADWEAR, av.headwears)}
      {chips('eyewear', av.eyewear, EYEWEAR, av.eyewears)}
      {chips('extra', av.extra, EXTRAS, av.extras)}
      <p className="flex gap-2 text-xs leading-relaxed text-subtle">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        {av.lockedLegend}
      </p>
    </div>
  )
}

function LockBadge({ u }: { u: Unlock }) {
  if (u.kind === 'pro')
    return (
      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-1.5 text-[0.6rem] leading-4 font-extrabold text-bg">
        {av.pro}
      </span>
    )
  return (
    <span className="absolute -top-1 -right-1 grid size-[18px] place-items-center rounded-full border border-border bg-card-2">
      <Lock className="size-2.5 text-muted" />
    </span>
  )
}

function Swatches({
  label,
  colors,
  value,
  locks,
  progress,
  onPick,
}: {
  label: string
  colors: readonly string[]
  value: number
  locks: Unlock[]
  progress: Progress
  onPick: (i: number) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-muted">{label}</legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {colors.map((c, i) => {
          const locked = !isUnlocked(locks[i]!, progress)
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={value === i}
              aria-label={`${label} ${i + 1}${locked ? ` · ${lockText(locks[i]!)}` : ''}`}
              onClick={() => onPick(i)}
              className={cn(
                'relative grid size-11 place-items-center rounded-full border-2 transition-transform active:scale-90',
                value === i ? 'border-fg' : 'border-transparent',
              )}
            >
              <span
                className={cn('size-8 rounded-full', locked && 'opacity-35')}
                style={{ background: c }}
              />
              {locked && <LockBadge u={locks[i]!} />}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Chips({
  label,
  options,
  labels,
  value,
  locks,
  progress,
  onPick,
}: {
  label: string
  options: readonly string[]
  labels: Record<string, string>
  value: string
  locks: Unlock[]
  progress: Progress
  onPick: (v: string) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o, i) => {
          const locked = !isUnlocked(locks[i]!, progress)
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={value === o}
              aria-label={locked ? `${labels[o]} · ${lockText(locks[i]!)}` : undefined}
              onClick={() => onPick(o)}
              className={cn(
                'relative h-10 rounded-full border px-3.5 text-sm font-medium transition-colors',
                value === o
                  ? 'border-accent bg-accent text-accent-fg'
                  : locked
                    ? 'border-border/60 bg-card/60 text-subtle'
                    : 'border-border bg-card text-muted hover:text-fg',
              )}
            >
              {labels[o]}
              {locked && <LockBadge u={locks[i]!} />}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
