import { NumberInput } from '@/components/ui/number-input'

interface UnitFieldProps {
  label: string
  unit: string
  value: number | null
  onChange: (v: number | null) => void
  kind?: 'decimal' | 'integer'
  autoFocus?: boolean
}

/** Campo numérico grande con la unidad a la derecha. */
export function UnitField({
  label,
  unit,
  value,
  onChange,
  kind = 'decimal',
  autoFocus,
}: UnitFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-muted">{label}</span>
      <span className="relative block">
        <NumberInput
          value={value}
          onValueChange={onChange}
          kind={kind}
          autoFocus={autoFocus}
          className="h-16 pr-14 pl-5 text-left text-2xl"
        />
        <span className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-muted">
          {unit}
        </span>
      </span>
    </label>
  )
}
