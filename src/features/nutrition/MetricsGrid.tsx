import { bmiCategory } from '@/domain/body-metrics'
import { formatDecimal } from '@/domain/numbers'
import { t } from '@/i18n'
import type { BodyMetrics } from '@/services/local-data'

const o = t.onboarding

/** Metabolismo basal, mantenimiento, IMC y % de grasa aproximado. */
export function MetricsGrid({ metrics }: { metrics: BodyMetrics }) {
  const items = [
    { label: o.bmr, value: formatDecimal(metrics.bmr, 0), unit: t.units.kcal },
    { label: o.maintenance, value: formatDecimal(metrics.maintenance, 0), unit: t.units.kcal },
    {
      label: o.bmiLabel,
      value: formatDecimal(metrics.bmi, 1),
      unit: t.labels.bmi[bmiCategory(metrics.bmi)],
    },
    { label: o.bodyFat, value: `~${formatDecimal(metrics.bodyFat, 0)}`, unit: '%' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-border bg-card p-3.5">
          <p className="text-xs text-muted">{it.label}</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="num text-xl font-semibold">{it.value}</span>
            <span className="truncate text-xs text-muted">{it.unit}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
