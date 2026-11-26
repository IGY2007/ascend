import { Dices } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ACCESSORIES,
  FACIAL,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFITS,
  SHIRT_COLORS,
  SKINS,
  randomAvatar,
  type AvatarConfig,
} from '@/domain/avatar'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const av = t.avatar

/** Opciones del personaje: colores en círculos y estilos en chips. Controlado. */
export function AvatarEditor({
  value,
  onChange,
}: {
  value: AvatarConfig
  onChange: (next: AvatarConfig) => void
}) {
  const set = <K extends keyof AvatarConfig>(key: K, v: AvatarConfig[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div className="space-y-5">
      <Button variant="secondary" size="sm" onClick={() => onChange(randomAvatar())}>
        <Dices />
        {av.random}
      </Button>
      <Swatches label={av.skin} colors={SKINS} value={value.skin} onPick={(i) => set('skin', i)} />
      <Chips
        label={av.hair}
        options={HAIR_STYLES}
        labels={av.hairStyles}
        value={value.hair}
        onPick={(v) => set('hair', v)}
      />
      {value.hair !== 'bald' && (
        <Swatches
          label={av.hairColor}
          colors={HAIR_COLORS}
          value={value.hairColor}
          onPick={(i) => set('hairColor', i)}
        />
      )}
      <Chips
        label={av.facial}
        options={FACIAL}
        labels={av.facials}
        value={value.facial}
        onPick={(v) => set('facial', v)}
      />
      <Chips
        label={av.outfit}
        options={OUTFITS}
        labels={av.outfits}
        value={value.outfit}
        onPick={(v) => set('outfit', v)}
      />
      {(value.outfit !== 'shirtless' || value.accessory === 'cap') && (
        <Swatches
          label={av.color}
          colors={SHIRT_COLORS}
          value={value.shirtColor}
          onPick={(i) => set('shirtColor', i)}
        />
      )}
      <Chips
        label={av.accessory}
        options={ACCESSORIES}
        labels={av.accessories}
        value={value.accessory}
        onPick={(v) => set('accessory', v)}
      />
    </div>
  )
}

function Swatches({
  label,
  colors,
  value,
  onPick,
}: {
  label: string
  colors: readonly string[]
  value: number
  onPick: (i: number) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {colors.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${label} ${i + 1}`}
            onClick={() => onPick(i)}
            className={cn(
              'grid size-11 place-items-center rounded-full border-2 transition-transform active:scale-90',
              value === i ? 'border-fg' : 'border-transparent',
            )}
          >
            <span className="size-8 rounded-full" style={{ background: c }} />
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Chips<T extends string>({
  label,
  options,
  labels,
  value,
  onPick,
}: {
  label: string
  options: readonly T[]
  labels: Record<T, string>
  value: T
  onPick: (v: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            onClick={() => onPick(o)}
            className={cn(
              'h-10 rounded-full border px-3.5 text-sm font-medium transition-colors',
              value === o
                ? 'border-accent bg-accent text-accent-fg'
                : 'border-border bg-card text-muted hover:text-fg',
            )}
          >
            {labels[o]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
