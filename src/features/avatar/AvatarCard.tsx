import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { useAvatar, useGameState, useLocalProfile } from '@/features/profile/hooks'
import { t } from '@/i18n'
import { AvatarFigure } from './AvatarFigure'

/** Tu personaje en el perfil, con acceso al editor. */
export function AvatarCard() {
  const avatar = useAvatar()
  const heightCm = useLocalProfile()?.heightCm
  const game = useGameState()
  if (!avatar) return null
  return (
    <Link
      to="/avatar"
      className="mt-3 flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-card p-4 transition-transform active:scale-[0.99]"
    >
      <span className="grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-bg-2/80">
        <AvatarFigure
          heightCm={heightCm}
          avatar={avatar}
          body={game?.monthBody}
          jerseyNumber={game?.level.level}
          className="h-24 w-auto"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t.avatar.title}</span>
        <span className="mt-0.5 block text-sm text-muted">{t.avatar.resetHint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent-2">
        {t.common.edit}
        <ChevronRight className="size-4" />
      </span>
    </Link>
  )
}
