import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import type { MacroTargets } from '@/types/models'

const MACROS = [
  { key: 'proteinG', label: t.macros.protein, kcalPerG: 4, color: 'bg-accent-2' },
  { key: 'carbsG', label: t.macros.carbsTile, kcalPerG: 4, color: 'bg-success' },
  { key: 'fatG', label: t.macros.fat, kcalPerG: 9, color: 'bg-warning' },
] as const

/** Los tres macros con el porcentaje de calorías que aporta cada uno. */
export function MacroTiles({ macros, className }: { macros: MacroTargets; className?: string }) {
  const total = macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9 || 1
  return (
    <div className={cn('grid grid-cols-3 gap-2.5', className)}>
      {MACROS.map((m) => {
        const grams = macros[m.key]
        const pct = Math.round(((grams * m.kcalPerG) / total) * 100)
        return (
          <div key={m.key} className="rounded-2xl border border-border/80 bg-bg-2/70 p-3">
            <p className="truncate text-xs font-medium text-muted">{m.label}</p>
            <p className="mt-1 flex items-baseline gap-0.5">
              <span className="num text-xl font-semibold">{grams}</span>
              <span className="text-xs text-muted">{t.units.g}</span>
            </p>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-card-2">
              <div
                className={cn('h-full origin-left rounded-full', m.color)}
                style={{ transform: `scaleX(${pct / 100})` }}
              />
            </div>
            <p className="mt-1.5 num text-[0.7rem] text-subtle">{pct}%</p>
          </div>
        )
      })}
    </div>
  )
}
