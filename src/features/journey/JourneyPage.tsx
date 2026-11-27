import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarFigure } from '@/features/avatar/AvatarFigure'
import { useAvatar, useGameState } from '@/features/profile/hooks'
import { CAMPS, type CampId } from '@/domain/journey'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { CampSheet } from './CampSheet'

const j = t.journey

// Lienzo de la montaña (coordenadas del SVG)
const W = 360
const H = 1000
const point = (i: number) => ({
  x: [180, 265, 105, 255, 120, 235, 180][i] ?? 180,
  y: 930 - i * 132,
})

/** El viaje: la montaña con los campamentos, desde el campamento base hasta el Olimpo. */
export function JourneyPage() {
  const navigate = useNavigate()
  const game = useGameState()
  const avatar = useAvatar()
  const [open, setOpen] = useState<CampId | null>(null)
  if (!game || !avatar) return <Skeleton className="h-[80dvh] rounded-[var(--radius-card)]" />

  const { journey, level } = game
  const pts = CAMPS.map((_, i) => point(i))
  const trail = pts
    .map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`
      const prev = pts[i - 1]!
      const my = (prev.y + p.y) / 2
      return `C${prev.x},${my} ${p.x},${my} ${p.x},${p.y}`
    })
    .join(' ')
  // Lo recorrido: hasta el campamento actual, más el tramo hacia el siguiente
  const doneSegments = journey.index + journey.progress
  const totalSegments = CAMPS.length - 1

  return (
    <>
      <header className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t.common.back}
          className="-ml-2 grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <ChevronLeft className="size-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">{j.title}</h1>
          <p className="text-sm text-muted">
            {j.campOf(journey.index + 1, CAMPS.length)} · {j.camps[journey.current.id]?.name}
          </p>
        </div>
      </header>

      <div
        className="relative -mx-5 overflow-hidden md:mx-0 md:rounded-[var(--radius-card)]"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <linearGradient id="j-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2e1065" />
              <stop offset="45%" stopColor="#1a1030" />
              <stop offset="100%" stopColor="var(--color-bg)" />
            </linearGradient>
            <linearGradient id="j-rock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4c3a7a" />
              <stop offset="100%" stopColor="#1c1530" />
            </linearGradient>
            <linearGradient id="j-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#d4a72c" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#j-sky)" />
          {/* Estrellas */}
          {Array.from({ length: 40 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 97) % W}
              cy={(i * 53) % 420}
              r={i % 5 === 0 ? 1.4 : 0.8}
              fill="#fff"
              opacity={0.15 + ((i * 7) % 10) / 25}
            />
          ))}
          {/* Cordillera de fondo */}
          <path
            d={`M0,520 L60,380 L110,450 L170,300 L230,420 L290,330 L360,460 L360,${H} L0,${H} Z`}
            fill="#2a1f4a"
            opacity={0.7}
          />
          {/* La montaña */}
          <path
            d={`M-20,${H} L40,760 L90,640 L130,520 L160,330 L180,140 L200,330 L235,500 L275,640 L320,770 L380,${H} Z`}
            fill="url(#j-rock)"
          />
          <path
            d="M180,140 L160,330 L172,300 L182,330 L194,290 L200,330 Z"
            fill="#e9e3ff"
            opacity={0.9}
          />
          {/* Nubes del Olimpo */}
          {[
            [110, 150, 46],
            [250, 140, 52],
            [180, 175, 70],
            [70, 190, 34],
            [300, 185, 38],
          ].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={r} ry={r! * 0.32} fill="#fff" opacity={0.14} />
          ))}
          {/* Templo en la cima */}
          <g transform="translate(180 66)">
            <path d="M-34,-6 L0,-24 L34,-6 Z" fill="url(#j-gold)" />
            <rect x={-34} y={-6} width={68} height={5} fill="#fde68a" />
            {[-26, -13, 0, 13, 26].map((x) => (
              <rect key={x} x={x - 2.5} y={0} width={5} height={30} fill="#f5e6b8" />
            ))}
            <rect x={-38} y={30} width={76} height={6} rx={1} fill="url(#j-gold)" />
          </g>
          {/* Sendero */}
          <path
            d={trail}
            fill="none"
            stroke="rgb(255 255 255 / 0.18)"
            strokeWidth={5}
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
          <path
            d={trail}
            fill="none"
            stroke="#a3e635"
            strokeWidth={5}
            strokeLinecap="round"
            pathLength={totalSegments}
            strokeDasharray={`${doneSegments} ${totalSegments}`}
          />
        </svg>

        {/* Campamentos */}
        {CAMPS.map((camp, i) => {
          const p = pts[i]!
          const reached = level.level >= camp.level
          const current = i === journey.index
          const left = p.x < W / 2
          return (
            <div
              key={camp.id}
              className="absolute w-0"
              style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
            >
              {current && (
                <span className="absolute bottom-[calc(100%+6px)] left-1/2 block size-12 -translate-x-1/2 overflow-hidden rounded-full border-2 border-success bg-card-2 shadow-[0_0_24px_rgb(163_230_53/0.5)]">
                  <AvatarFigure avatar={avatar} variant="head" className="size-full" />
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen(camp.id)}
                aria-label={j.camps[camp.id]?.name}
                className={cn(
                  'relative grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-bold shadow-lg transition-transform active:scale-95',
                  camp.id === 'olympus' && reached && 'border-amber-200 bg-amber-300 text-bg',
                  camp.id !== 'olympus' && reached && 'border-success bg-success text-bg',
                  !reached && 'border-white/20 bg-[#1c1530] text-white/60',
                  current && 'ring-4 ring-success/30',
                )}
              >
                {reached ? <span className="num">{i + 1}</span> : <Lock className="size-4" />}
              </button>
              <span
                className={cn(
                  'absolute top-0 w-32 -translate-y-1/2 text-xs leading-tight [text-shadow:0_1px_6px_rgb(0_0_0/0.9)]',
                  left ? 'left-9 text-left' : 'right-9 text-right',
                )}
              >
                <span
                  className={cn('block font-semibold', reached ? 'text-white' : 'text-white/60')}
                >
                  {j.camps[camp.id]?.name}
                </span>
                <span className="block num text-white/60">{t.game.levelShort(camp.level)}</span>
              </span>
            </div>
          )
        })}
      </div>

      <CampSheet campId={open} level={level.level} onClose={() => setOpen(null)} />
    </>
  )
}
