import { NavLink } from 'react-router'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { NAV_ITEMS } from '../nav'

export function BottomNav() {
  return (
    <nav
      aria-label={t.nav.main}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-bg/80 pb-safe backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pr-safe pl-safe">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className="group flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium"
            >
              {({ isActive }) => (
                <>
                  <span className="relative grid h-8 w-14 place-items-center">
                    {isActive && (
                      <motion.span
                        layoutId="bottom-nav-active"
                        className="absolute inset-0 rounded-full bg-accent/16"
                        transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'relative size-[22px] transition-[color,transform] duration-200 group-active:scale-90',
                        isActive ? 'text-accent-2' : 'text-muted',
                      )}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </span>
                  <span className={cn('transition-colors', isActive ? 'text-fg' : 'text-muted')}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
