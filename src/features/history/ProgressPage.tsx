import { useState } from 'react'
import { History, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { WeightChart } from '@/features/body/WeightChart'
import { LogWeightSheet } from '@/features/body/LogWeightSheet'
import { useBodyWeights, useLocalProfile } from '@/features/profile/hooks'
import { bodyWeightService } from '@/services/local-data'
import { filterRange, weightStats } from '@/domain/body-weight'
import { fromDateKey, toDateKey } from '@/domain/dates'
import { formatDecimal, formatSigned } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { locale, t } from '@/i18n'
import type { BodyWeight } from '@/types/models'

const p = t.progress
const RANGES = [
  { key: 'd30', days: 30 },
  { key: 'd90', days: 90 },
  { key: 'all', days: null },
] as const
const entryDate = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

const signed = (n: number | null) => (n === null ? '—' : formatSigned(n, 1))

export function ProgressPage() {
  const weights = useBodyWeights()
  const profile = useLocalProfile()
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('d30')
  const [logOpen, setLogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<BodyWeight | null>(null)

  const today = toDateKey(new Date())
  const ascending = weights ? [...weights].reverse() : []
  const stats = weightStats(ascending, today, profile?.targetWeightKg ?? null)
  const days = RANGES.find((r) => r.key === range)?.days ?? null
  const points = filterRange(ascending, today, days)

  return (
    <>
      <PageHeader
        title={p.title}
        subtitle={p.subtitle}
        action={
          <Button size="sm" onClick={() => setLogOpen(true)}>
            <Plus />
            {t.home.logWeight}
          </Button>
        }
      />

      <h2 className="mb-3 px-1 text-sm font-medium text-muted">{p.weightTitle}</h2>
      {weights === undefined ? (
        <Skeleton className="h-80 rounded-[var(--radius-card)]" />
      ) : (
        <Card className="px-4">
          <div className="grid grid-cols-3 gap-2 px-1">
            <Stat
              label={t.home.weight}
              value={stats.latest ? formatDecimal(stats.latest.weightKg, 1) : '—'}
              big
            />
            <Stat
              label={p.weekAvg}
              value={stats.weekAvg !== null ? formatDecimal(stats.weekAvg, 1) : '—'}
            />
            <Stat label={p.totalChange} value={signed(stats.totalChange)} />
          </div>

          {/* Filtros en una fila arriba del gráfico */}
          <div className="mt-5 mb-3 flex gap-1.5 px-1" role="radiogroup">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={range === r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  'h-9 rounded-full px-3.5 text-sm font-medium transition-colors',
                  range === r.key ? 'bg-accent/16 text-accent-2' : 'text-muted hover:text-fg',
                )}
              >
                {p.ranges[r.key]}
              </button>
            ))}
          </div>
          <WeightChart points={points} />
        </Card>
      )}

      {weights && weights.length > 0 && (
        <>
          <h2 className="mt-6 mb-3 px-1 text-sm font-medium text-muted">{p.entries}</h2>
          <Card className="divide-y divide-border p-0">
            {weights.map((w, i) => {
              const prev = weights[i + 1]
              const diff = prev ? Math.round((w.weightKg - prev.weightKg) * 10) / 10 : null
              return (
                <div key={w.id} className="flex items-center gap-3 py-1 pr-1 pl-5">
                  <span className="flex-1 text-[0.95rem] text-muted first-letter:uppercase">
                    {entryDate.format(fromDateKey(w.date))}
                  </span>
                  {diff !== null && diff !== 0 && (
                    <span className="num text-xs text-subtle">{signed(diff)}</span>
                  )}
                  <span className="w-20 text-right num font-semibold">
                    {formatDecimal(w.weightKg, 1)}{' '}
                    <span className="text-xs font-normal text-muted">{t.units.kg}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setToDelete(w)}
                    aria-label={p.deleteEntry}
                    className="grid size-11 place-items-center rounded-xl text-subtle transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )
            })}
          </Card>
        </>
      )}

      <h2 className="mt-8 mb-3 px-1 text-sm font-medium text-muted">{p.historyTitle}</h2>
      <EmptyState icon={History} title={p.emptyTitle} description={p.emptyBody} comingSoon />

      <LogWeightSheet
        open={logOpen}
        onOpenChange={setLogOpen}
        initial={stats.latest?.weightKg ?? null}
      />
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={p.deleteConfirmTitle}
        description={
          toDelete ? p.deleteConfirmBody(entryDate.format(fromDateKey(toDelete.date))) : ''
        }
        confirmLabel={p.delete}
        destructive
        onConfirm={() => {
          if (toDelete) void bodyWeightService.remove(toDelete.id)
          setToDelete(null)
        }}
      />
    </>
  )
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className={cn('mt-1 num font-bold', big ? 'text-2xl' : 'text-lg')}>
        {value}
        {value !== '—' && (
          <span className="ml-0.5 text-xs font-normal text-muted">{t.units.kg}</span>
        )}
      </p>
    </div>
  )
}
