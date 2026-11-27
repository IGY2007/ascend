import { Link } from 'react-router'
import {
  Dumbbell,
  Flame,
  Mountain,
  Settings,
  Images,
  Trophy,
  Weight,
  type LucideIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarFigure } from '@/features/avatar/AvatarFigure'
import { AchievementsGrid } from '@/features/game/AchievementsGrid'
import { StreakBadge } from '@/features/game/StreakBadge'
import { useUser } from '@/features/auth/auth-context'
import { CAMPS } from '@/domain/journey'
import { formatDecimal } from '@/domain/numbers'
import { cn } from '@/lib/utils'
import { formatMonthYear, t } from '@/i18n'
import { PhotoGrid } from '@/features/gallery/PhotoGrid'
import { usePhotos } from '@/features/gallery/hooks'
import { FriendsPreview } from './FriendsPreview'
import { useDisplayName } from './use-profile'
import { useAvatar, useGameState, useLocalProfile } from './hooks'

const pp = t.profilePage

/**
 * Tu perfil, estilo Duolingo: tu tarjeta de jugador (personaje, racha, toneladas, logros) y tus
 * amigos. La configuración está en Ajustes (engranaje arriba a la izquierda).
 */
export function ProfilePage() {
  const user = useUser()
  const name = useDisplayName()
  const profile = useLocalProfile()
  const game = useGameState()
  const avatar = useAvatar()
  const photos = usePhotos()

  const since = profile?.completedAt ?? user.createdAt
  const totals = game
    ? {
        workouts: game.facts.sessions.length,
        tonnes: game.facts.sessions.reduce((n, s) => n + s.volume, 0) / 1000,
        records: game.facts.prs.length,
      }
    : null

  return (
    <>
      <header className="mb-4 flex items-center justify-between gap-2">
        <Link
          to="/settings"
          aria-label={pp.settings}
          className="-ml-2 grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <Settings className="size-6" />
        </Link>
        <h1 className="text-lg font-bold">{pp.title}</h1>
        <span className="size-11" aria-hidden />
      </header>

      {/* Tu tarjeta */}
      {!game || !avatar ? (
        <Skeleton className="h-72 rounded-[var(--radius-card)]" />
      ) : (
        <Link
          to="/physique"
          className="relative block overflow-hidden rounded-[var(--radius-card)] border border-accent/40 transition-transform active:scale-[0.99]"
          style={{
            background:
              'radial-gradient(80% 70% at 50% 100%, rgb(139 92 246 / 0.35), transparent 70%), var(--color-card)',
          }}
        >
          <div className="flex items-end gap-2 px-4 pt-4">
            <AvatarFigure
              avatar={avatar}
              body={game.monthBody}
              jerseyNumber={game.level.level}
              heightCm={profile?.heightCm}
              className="h-52 w-auto shrink-0"
              title={t.avatar.title}
            />
            <div className="min-w-0 flex-1 pb-5">
              <p className="truncate text-2xl leading-tight font-bold">
                {name ?? user.email ?? t.app.name}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {t.game.levelShort(game.level.level)} ·{' '}
                <span className="text-success">{t.game.titles[game.level.title]}</span>
              </p>
              <StreakBadge streak={game.streak} className="mt-2" />
              {since && (
                <p className="mt-3 text-xs leading-snug text-muted first-letter:uppercase">
                  {pp.since(formatMonthYear(new Date(since)))}
                </p>
              )}
            </div>
          </div>
        </Link>
      )}

      {/* Tus números */}
      {game && totals && (
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Stat
            icon={Flame}
            tone="warning"
            label={pp.stats.streak}
            value={t.streak.short(game.streak.current)}
          />
          <Stat
            icon={Trophy}
            tone="accent"
            label={pp.stats.bestStreak}
            value={t.streak.short(game.streak.best)}
          />
          <Stat
            icon={Weight}
            tone="success"
            label={pp.stats.tonnes}
            value={`${formatDecimal(totals.tonnes, 1)} t`}
          />
          <Stat
            icon={Dumbbell}
            tone="accent"
            label={pp.stats.workouts}
            value={String(totals.workouts)}
          />
          <Stat
            icon={Trophy}
            tone="warning"
            label={pp.stats.records}
            value={String(totals.records)}
          />
          <Link to="/journey" className="contents">
            <Stat
              icon={Mountain}
              tone="success"
              label={pp.stats.camp}
              value={`${game.journey.index + 1}/${CAMPS.length}`}
              hint={t.journey.camps[game.journey.current.id]?.name}
            />
          </Link>
        </div>
      )}
      {game && game.streak.current === 0 && (
        <p className="mt-2 px-1 text-xs text-subtle">{t.streak.none}</p>
      )}

      {/* Logros */}
      <h2 className="mt-7 mb-3 px-1 text-sm font-medium text-muted">{t.game.achievementsTitle}</h2>
      <AchievementsGrid />

      {/* Galería: fotos compartidas y de progreso */}
      <div className="mt-7 mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-muted">{pp.gallery}</h2>
        <Link to="/gallery" className="-my-2 py-2 text-sm font-semibold text-accent-2">
          {pp.seeAll}
        </Link>
      </div>
      {photos && photos.length > 0 ? (
        <PhotoGrid photos={photos.slice(0, 6)} />
      ) : (
        <Link
          to="/gallery"
          className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border p-4"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-card-2 text-accent-2">
            <Images className="size-5" />
          </span>
          <p className="text-sm leading-relaxed text-muted">{pp.galleryEmpty}</p>
        </Link>
      )}

      {game && avatar && <FriendsPreview game={game} avatar={avatar} />}
    </>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  tone: 'accent' | 'success' | 'warning'
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-xl',
          tone === 'accent' && 'bg-accent/15 text-accent-2',
          tone === 'success' && 'bg-success/15 text-success',
          tone === 'warning' && 'bg-warning/15 text-warning',
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate num text-lg leading-tight font-bold">{value}</span>
        <span className="block truncate text-xs text-muted">{hint ?? label}</span>
      </span>
    </div>
  )
}
