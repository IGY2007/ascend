import { Link } from 'react-router'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarFigure } from '@/features/avatar/AvatarFigure'
import { Mascot } from '@/features/avatar/Mascot'
import { bodyComment } from '@/features/avatar/body-comment'
import { useAvatar, useGameState, useLocalProfile } from '@/features/profile/hooks'
import { formatMonthYear, t } from '@/i18n'

const g = t.game

/**
 * Lo primero que ves al abrir la app: tu personaje con el físico del mes, tu nivel y Volt
 * comentando cómo venís. Tocar lleva a la ficha completa.
 */
export function HeroCard({ trainedToday }: { trainedToday: boolean }) {
  const game = useGameState()
  const avatar = useAvatar()
  const profile = useLocalProfile()
  if (!game || !avatar) return <Skeleton className="h-64 rounded-[var(--radius-card)]" />
  const { level } = game
  const month = formatMonthYear(new Date()).split(' ')[0]!

  return (
    <Link
      to="/physique"
      className="relative block overflow-hidden rounded-[var(--radius-card)] border border-accent/40 shadow-[0_12px_40px_-16px_rgb(139_92_246/0.5)] transition-transform active:scale-[0.99]"
      aria-label={`${t.avatar.title} · ${g.level(level.level)}`}
      style={{
        background:
          'radial-gradient(90% 80% at 25% 85%, rgb(139 92 246 / 0.38), transparent 70%), radial-gradient(60% 50% at 95% 5%, rgb(163 230 53 / 0.12), transparent 70%), var(--color-card)',
      }}
    >
      {/* Piso */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/25 to-transparent" />
      <div className="relative flex items-end">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-[46%] shrink-0 pt-3 pl-2"
        >
          <AvatarFigure
            avatar={avatar}
            body={game.monthBody}
            jerseyNumber={level.level}
            heightCm={profile?.heightCm}
            className="mx-auto h-60 w-auto"
            title={t.avatar.title}
          />
        </motion.div>

        <div className="flex min-w-0 flex-1 flex-col self-stretch py-4 pr-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted first-letter:uppercase">
                {t.avatar.monthBody(month)}
              </p>
              <p className="mt-0.5 text-lg leading-tight font-bold">
                {g.levelShort(level.level)} ·{' '}
                <span className="text-success">{g.titles[level.title]}</span>
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted" />
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
            <motion.div
              className="h-full origin-left rounded-full bg-gradient-to-r from-accent to-success"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: level.into / level.needed }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <p className="mt-1 num text-[0.7rem] text-muted">{g.xp(level.into, level.needed)}</p>

          {/* Volt comenta */}
          <div className="mt-auto pt-3">
            <p className="rounded-2xl rounded-br-md bg-black/35 px-3 py-2 text-[0.8rem] leading-snug text-fg/90">
              {bodyComment(game.monthBody, game.monthSets)}
            </p>
            <div className="-mt-1 flex justify-end">
              <Mascot
                size={78}
                pose={trainedToday ? 'cheer' : 'flex'}
                mood={trainedToday ? 'proud' : 'wink'}
                bounce
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
