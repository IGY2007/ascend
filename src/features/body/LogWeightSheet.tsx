import { useState } from 'react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { UnitField } from '@/features/onboarding/UnitField'
import { bodyWeightService } from '@/services/local-data'
import { t } from '@/i18n'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: number | null
  /** Día del registro (por defecto, hoy). */
  date?: string
}

/** Registrar el peso de hoy. Si ya había uno hoy, lo reemplaza. */
export function LogWeightSheet({ open, onOpenChange, initial, date }: Props) {
  const [value, setValue] = useState<number | null>(initial)
  const valid = value !== null && value >= 30 && value <= 300

  const save = async () => {
    if (!valid) return
    await bodyWeightService.log(Math.round(value * 10) / 10, date)
    toast.success(t.progress.weightSaved)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      onOpen={() => setValue(initial)}
      title={t.progress.logWeight}
      description={t.progress.logWeightHint}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
        className="space-y-5 pt-2"
      >
        <UnitField
          label={date ? t.progress.dayWeight : t.progress.todayWeight}
          unit={t.units.kg}
          value={value}
          onChange={setValue}
          autoFocus
        />
        <Button type="submit" size="lg" block disabled={!valid}>
          {t.common.save}
        </Button>
      </form>
    </Sheet>
  )
}
