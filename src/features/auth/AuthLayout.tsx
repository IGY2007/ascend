import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Logo, Wordmark } from '@/components/brand/Logo'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden px-5 pt-safe pb-safe">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-accent/14 blur-[120px]"
      />
      <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-10 flex items-center gap-3">
            <Logo className="size-9" />
            <Wordmark />
          </div>
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-[0.95rem] text-muted">{footer}</div>}
        </motion.div>
      </div>
    </div>
  )
}
