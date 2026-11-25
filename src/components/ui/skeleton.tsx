import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Placeholder de carga. Solo anima opacity. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-skeleton rounded-xl bg-card-2', className)}
      {...props}
    />
  )
}
