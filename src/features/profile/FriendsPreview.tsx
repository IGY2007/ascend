import { Crown, Flame, Plus, UserPlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { AvatarFigure } from '@/features/avatar/AvatarFigure'
import { defaultAvatar, type AvatarConfig } from '@/domain/avatar'
import { fromDateKey, startOfWeek, toDateKey } from '@/domain/dates'
import type { GameState } from '@/services/gamification'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

const pp = t.profilePage

/**
 * Vista previa de amigos: cómo se va a ver un grupo cuando haya cuentas. Los amigos son DATOS DE
 * EJEMPLO (claramente marcados); lo único real es tu fila.
 */
const DEMO: { name: string; workouts: number; streak: number; avatar: AvatarConfig }[] = [
  {
    name: 'Nacho',
    workouts: 4,
    streak: 23,
    avatar: { ...defaultAvatar('male'), skin: 3, hair: 'buzz', facial: 'beard', hairColor: 0 },
  },
  {
    name: 'Sofi',
    workouts: 3,
    streak: 41,
    avatar: { ...defaultAvatar('female'), skin: 1, hair: 'long', hairColor: 3 },
  },
  {
    name: 'Tomi',
    workouts: 2,
    streak: 9,
    avatar: { ...defaultAvatar('male'), skin: 4, hair: 'curly', headwear: 'cap' },
  },
  {
    name: 'Cami',
    workouts: 1,
    streak: 5,
    avatar: { ...defaultAvatar('female'), skin: 2, hair: 'bun', hairColor: 2 },
  },
]

export function FriendsPreview({ game, avatar }: { game: GameState; avatar: AvatarConfig }) {
  const week = toDateKey(startOfWeek(new Date()))
  const mine = game.facts.sessions.filter(
    (s) => toDateKey(startOfWeek(fromDateKey(s.date))) === week,
  ).length
  const rows = [
    ...DEMO.map((d) => ({ ...d, me: false })),
    { name: pp.you, workouts: mine, streak: game.streak.current, avatar, me: true },
  ].sort((a, b) => b.workouts - a.workouts || b.streak - a.streak)

  return (
    <>
      <h2 className="mt-7 mb-3 flex items-center gap-2 px-1 text-sm font-medium text-muted">
        {pp.friends}
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[0.65rem] font-semibold text-warning">
          {pp.friendsPreview}
        </span>
      </h2>
      <Card className="p-0">
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{pp.demoGroup}</p>
            <p className="text-xs text-muted">{pp.weekRanking}</p>
          </div>
          <div className="flex -space-x-2">
            {DEMO.slice(0, 3).map((d) => (
              <span
                key={d.name}
                className="block size-8 overflow-hidden rounded-full border-2 border-card bg-card-2"
              >
                <AvatarFigure avatar={d.avatar} variant="head" className="size-full" />
              </span>
            ))}
          </div>
        </div>
        <ol className="mt-3 divide-y divide-border">
          {rows.map((r, i) => (
            <li
              key={r.name}
              className={cn('flex items-center gap-3 px-4 py-2.5', r.me && 'bg-accent/10')}
            >
              <span
                className={cn(
                  'w-5 text-center num text-sm font-bold',
                  i === 0 ? 'text-warning' : 'text-subtle',
                )}
              >
                {i === 0 ? <Crown className="mx-auto size-4" /> : i + 1}
              </span>
              <span className="block size-9 shrink-0 overflow-hidden rounded-full bg-card-2">
                <AvatarFigure avatar={r.avatar} variant="head" className="size-full" />
              </span>
              <span className={cn('min-w-0 flex-1 truncate font-medium', r.me && 'text-accent-2')}>
                {r.name}
              </span>
              <span className="flex items-center gap-1 num text-xs text-muted">
                <Flame className="size-3.5 text-warning" />
                {r.streak}
              </span>
              <span className="w-20 text-right num text-sm font-semibold">
                {pp.workoutsWeek(r.workouts)}
              </span>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
          {[
            [Plus, pp.createGroup],
            [UserPlus, pp.inviteFriends],
          ].map(([Icon, label]) => {
            const I = Icon as typeof Plus
            return (
              <button
                key={label as string}
                type="button"
                disabled
                className="flex h-12 flex-col items-center justify-center rounded-xl bg-card-2 text-sm font-medium text-subtle"
              >
                <span className="flex items-center gap-1.5">
                  <I className="size-4" />
                  {label as string}
                </span>
                <span className="text-[0.62rem] leading-none">{pp.comingSoon}</span>
              </button>
            )
          })}
        </div>
      </Card>
      <p className="mt-2 px-1 text-xs leading-relaxed text-subtle">{pp.friendsPreviewBody}</p>
    </>
  )
}
