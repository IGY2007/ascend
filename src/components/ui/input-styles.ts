import { cn } from '@/lib/utils'

export const inputClassName = cn(
  'h-13 w-full rounded-[var(--radius-field)] border border-border bg-bg-2 px-4 text-base text-fg',
  'transition-[border-color,box-shadow] duration-150 placeholder:text-subtle',
  'focus:border-accent/70 focus:shadow-[0_0_0_4px_rgb(124_58_237/0.14)] focus:outline-none',
  'disabled:opacity-50 aria-[invalid=true]:border-danger/60',
)
