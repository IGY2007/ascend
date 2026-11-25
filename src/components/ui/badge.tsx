import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'accent' | 'success'
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium',
        tone === 'neutral' && 'border border-border bg-card-2 text-muted',
        tone === 'accent' && 'bg-accent/15 text-accent-2',
        tone === 'success' && 'bg-success/12 text-success',
        className,
      )}
      {...props}
    />
  )
}
