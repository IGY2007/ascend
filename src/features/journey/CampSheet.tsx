import { Lock, Sparkles } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Tip } from '@/components/ui/tip'
import { CAMPS, type CampId } from '@/domain/journey'
import {
  HAIR_COLORS,
  SHIRT_COLORS,
  SHOES_COLORS,
  unlocksAtLevel,
  type AvatarConfig,
} from '@/domain/avatar'
import { t } from '@/i18n'

const j = t.journey
const av = t.avatar

/** Nombre legible de un desbloqueo del personaje (ej.: "Gorra", "Color de pelo"). */
function unlockLabel(field: keyof AvatarConfig, value: string): { label: string; color?: string } {
  const lists: Partial<Record<keyof AvatarConfig, Record<string, string>>> = {
    hair: av.hairStyles,
    eyes: av.eyeStyles,
    facial: av.facials,
    outfit: av.outfits,
    headwear: av.headwears,
    eyewear: av.eyewears,
    extra: av.extras,
  }
  const colors: Partial<Record<keyof AvatarConfig, [string, readonly string[]]>> = {
    hairColor: [av.hairColor, HAIR_COLORS],
    shirtColor: [av.color, SHIRT_COLORS],
    shoesColor: [av.shoes, SHOES_COLORS],
  }
  const c = colors[field]
  if (c) return { label: c[0], color: c[1][Number(value)] }
  return { label: lists[field]?.[value] ?? value }
}

/** La historia de un campamento del viaje y lo que desbloquea. */
export function CampSheet({
  campId,
  level,
  onClose,
}: {
  campId: CampId | null
  level: number
  onClose: () => void
}) {
  const camp = CAMPS.find((c) => c.id === campId)
  const text = campId ? j.camps[campId] : null
  const reached = !!camp && level >= camp.level
  const unlocks = camp ? unlocksAtLevel(camp.level) : []

  return (
    <Sheet open={!!camp} onOpenChange={(o) => !o && onClose()} title={text?.name ?? ''}>
      {camp && text && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-success">
              {j.kinds[camp.kind]}
            </span>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-2">
              {text.era}
            </span>
            <span className="rounded-full bg-card-2 px-3 py-1 num text-xs text-muted">
              {t.game.levelShort(camp.level)}
            </span>
          </div>

          {reached ? (
            <>
              <h3 className="text-xl leading-tight font-bold">{text.title}</h3>
              <p className="leading-relaxed text-fg/90">{text.story}</p>
              <Tip mood="proud">
                <span className="font-semibold text-fg">{j.lesson}: </span>
                {text.lesson}
              </Tip>
            </>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted">
              <Lock className="size-4 shrink-0" />
              {j.lockedAt(camp.level)}
            </p>
          )}

          {unlocks.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted">
                <Sparkles className="size-4 text-success" />
                {j.unlocks}
              </p>
              <div className="flex flex-wrap gap-2">
                {unlocks.map((u) => {
                  const { label, color } = unlockLabel(u.field, u.value)
                  return (
                    <span
                      key={`${u.field}:${u.value}`}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
                    >
                      {color && (
                        <span className="size-3.5 rounded-full" style={{ background: color }} />
                      )}
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
