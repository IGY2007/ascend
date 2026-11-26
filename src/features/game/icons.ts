import {
  CalendarCheck,
  Droplet,
  Dumbbell,
  Flame,
  Layers,
  Scale,
  Trophy,
  Weight,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { AchievementIcon } from '@/domain/gamification'

export const ACHIEVEMENT_ICONS: Record<AchievementIcon, LucideIcon> = {
  dumbbell: Dumbbell,
  trophy: Trophy,
  flame: Flame,
  droplet: Droplet,
  zap: Zap,
  weight: Weight,
  scale: Scale,
  layers: Layers,
  calendar: CalendarCheck,
}
