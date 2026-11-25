import { Apple, Dumbbell, House, TrendingUp, UserRound, type LucideIcon } from 'lucide-react'
import { t } from '@/i18n'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Solo secciones que existen. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: t.nav.home, icon: House },
  { to: '/workouts', label: t.nav.workouts, icon: Dumbbell },
  { to: '/progress', label: t.nav.progress, icon: TrendingUp },
  { to: '/nutrition', label: t.nav.nutrition, icon: Apple },
  { to: '/profile', label: t.nav.profile, icon: UserRound },
]
