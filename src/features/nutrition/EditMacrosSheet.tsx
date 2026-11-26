import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { UnitField } from '@/features/onboarding/UnitField'
import { nutritionService } from '@/services/local-data'
import { kcalFromMacros } from '@/domain/nutrition'
import { formatDecimal } from '@/domain/numbers'
import { t } from '@/i18n'
import type { MacroTargets } from '@/types/models'

const pr = t.profile

/** Editar los macros a mano. Las calorías salen de los macros. */
export function EditMacrosSheet({
  open,
  onOpenChange,
  current,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  current: MacroTargets
}) {
  const [p, setP] = useState<number | null>(current.proteinG)
  const [c, setC] = useState<number | null>(current.carbsG)
  const [f, setF] = useState<number | null>(current.fatG)
  const valid = [p, c, f].every((v) => v !== null && v >= 0 && v <= 1000)
  const kcal = valid ? kcalFromMacros({ proteinG: p!, carbsG: c!, fatG: f! }) : null

  const save = async () => {
    if (!valid) return
    await nutritionService.setManual({
      proteinG: Math.round(p!),
      carbsG: Math.round(c!),
      fatG: Math.round(f!),
    })
    toast.success(pr.macrosSaved)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      onOpen={() => {
        setP(current.proteinG)
        setC(current.carbsG)
        setF(current.fatG)
      }}
      title={pr.editMacros}
      description={pr.editMacrosHint}
    >
      <form
        className="space-y-4 pt-2"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <UnitField
          label={t.macros.protein}
          unit={t.units.g}
          kind="integer"
          value={p}
          onChange={setP}
        />
        <UnitField
          label={t.macros.carbs}
          unit={t.units.g}
          kind="integer"
          value={c}
          onChange={setC}
        />
        <UnitField label={t.macros.fat} unit={t.units.g} kind="integer" value={f} onChange={setF} />
        <p className="text-center num text-sm text-muted">
          ={' '}
          <span className="text-lg font-semibold text-fg">
            {kcal !== null ? formatDecimal(kcal, 0) : '—'}
          </span>{' '}
          {t.units.kcal}
        </p>
        <Button type="submit" size="lg" block disabled={!valid}>
          {t.common.save}
        </Button>
      </form>
    </Sheet>
  )
}
