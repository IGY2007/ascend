import { cn } from '@/lib/utils'
import { LOGO_PATHS } from './logo-paths'

/**
 * Logo de ASCEND: una "A" formada por un pico, con un chevron ascendente violeta como travesaño.
 */

interface LogoProps {
  className?: string
  title?: string
}

export function Logo({ className, title = 'ASCEND' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={cn('size-8', className)}
      fill="none"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points={LOGO_PATHS.peak} className="stroke-fg" />
      <polyline points={LOGO_PATHS.chevron} className="stroke-accent" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('text-[0.95rem] font-semibold tracking-[0.32em] text-fg', className)}>
      ASCEND
    </span>
  )
}
