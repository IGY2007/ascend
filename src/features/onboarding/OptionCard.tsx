import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptionCardProps {
  selected: boolean
  onSelect: () => void
  title: string
  description?: string
  icon?: LucideIcon
  badge?: string
  className?: string
}

export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon: Icon,
  badge,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex min-h-16 w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-[transform,background-color,border-color] duration-150 active:scale-[0.98]',
        selected
          ? 'border-accent/70 bg-accent/12'
          : 'border-border bg-card hover:border-border-strong',
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-xl transition-colors',
            selected ? 'bg-accent text-accent-fg' : 'bg-card-2 text-muted',
          )}
        >
          <Icon className="size-5" strokeWidth={1.9} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{title}</span>
          {badge && (
            <span className="rounded-full bg-accent/16 px-2 py-0.5 text-[0.7rem] font-semibold text-accent-2">
              {badge}
            </span>
          )}
        </span>
        {description && (
          <span className="mt-0.5 block text-sm leading-snug text-muted">{description}</span>
        )}
      </span>
      <span
        aria-hidden
        className={cn(
          'grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
          selected ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong',
        )}
      >
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </button>
  )
}
