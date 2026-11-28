import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Resalta la card activa con el brillo violeta de la referencia. */
  highlight?: boolean
}

export function Card({ className, highlight, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-border bg-card p-5',
        highlight &&
          'border-accent/40 bg-[radial-gradient(120%_120%_at_0%_0%,rgb(124_58_237/0.28),transparent_60%),var(--color-card)] shadow-[0_12px_40px_-16px_rgb(124_58_237/0.5)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[0.95rem] font-semibold text-fg', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted', className)} {...props} />
}
