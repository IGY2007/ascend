import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { Logo, Wordmark } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { NAV_ITEMS } from '../nav'

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border/70 bg-bg-2/60 px-3 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2.5 px-3">
        <Logo className="size-7" />
        <Wordmark className="text-sm" />
      </div>
      <nav aria-label={t.nav.main}>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className="group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl border border-accent/25 bg-accent/12"
                        transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                      />
                    )}
                    <Icon
                      className={cn('relative size-5', isActive ? 'text-accent-2' : 'text-muted')}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span
                      className={cn(
                        'relative transition-colors',
                        isActive ? 'text-fg' : 'text-muted group-hover:text-fg',
                      )}
                    >
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
