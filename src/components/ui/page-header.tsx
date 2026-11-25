import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[0.95rem] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
