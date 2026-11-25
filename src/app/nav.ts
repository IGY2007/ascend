import { Dumbbell, House, TrendingUp, UserRound, type LucideIcon } from 'lucide-react'
import { t } from '@/i18n'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Solo secciones que existen. Nutrición se suma en la Fase 4. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: t.nav.home, icon: House },
  { to: '/workouts', label: t.nav.workouts, icon: Dumbbell },
  { to: '/progress', label: t.nav.progress, icon: TrendingUp },
  { to: '/profile', label: t.nav.profile, icon: UserRound },
]
