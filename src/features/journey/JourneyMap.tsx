import { useEffect, useRef, useState } from 'react'
import { Apple, BookOpen, Brain, Crown, Dumbbell, Lock, Moon, type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarFigure } from '@/features/avatar/AvatarFigure'
import { useAvatar, useGameState } from '@/features/profile/hooks'
import { CAMPS, type CampId, type CampKind } from '@/domain/journey'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { CampSheet } from './CampSheet'

const j = t.journey
const ROW = 112
const TOP = 230 // lugar para el templo del Olimpo

const KIND_ICON: Record<CampKind, LucideIcon> = {
  history: BookOpen,
  training: Dumbbell,
  nutrition: Apple,
  recovery: Moon,
  mind: Brain,
  myth: Crown,
}

/** x en % (zigzag suave) para la fila i contando desde arriba. */
const xAt = (i: number) => 50 + 26 * Math.sin(i * 0.85)

/**
 * La subida al Olimpo como un sendero (estilo Duolingo): de abajo (campamento base) hacia
 * arriba, con el templo en la cima. Usa los colores del tema, así se ve bien en claro y oscuro.
 */
export function JourneyMap() {
  const game = useGameState()
  const avatar = useAvatar()
  const [open, setOpen] = useState<CampId | null>(null)
  const currentRef = useRef<HTMLDivElement>(null)
  const ready = !!game && !!avatar

  // Al entrar, el sendero arranca centrado en donde estás
  useEffect(() => {
    if (ready) currentRef.current?.scrollIntoView({ block: 'center' })
  }, [ready])

  if (!game || !avatar) return <Skeleton className="h-[70dvh] rounded-[var(--radius-card)]" />

  const { journey, level } = game
  // De arriba (Olimpo) hacia abajo (base)
  const rows = [...CAMPS].map((c, idx) => ({ camp: c, idx })).reverse()
  const height = TOP + rows.length * ROW + 40
  const yAt = (r: number) => TOP + r * ROW + ROW / 2
  const pts = rows.map((_, r) => ({ x: xAt(r), y: yAt(r) }))
  const pathOf = (list: { x: number; y: number }[]) =>
    list
      .map((p, i) => {
        if (i === 0) return `M${p.x},${p.y}`
        const prev = list[i - 1]!
        const my = (prev.y + p.y) / 2
        return `C${prev.x},${my} ${p.x},${my} ${p.x},${p.y}`
      })
      .join(' ')
  // Lo recorrido: desde el campamento base hasta el checkpoint actual
  const currentRow = rows.findIndex((r) => r.idx === journey.index)
  const done = pts.slice(currentRow)

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-card)] border border-accent/30"
      style={{
        height,
        // Halo violeta alrededor del sendero y un cielo más intenso arriba, cerca del Olimpo
        background:
          'radial-gradient(70% 45% at 0% 60%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent 70%), radial-gradient(70% 45% at 100% 30%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent 70%), radial-gradient(60% 30% at 50% 100%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 70%), linear-gradient(to bottom, color-mix(in oklab, var(--color-accent) 30%, var(--color-card)) 0%, var(--color-card) 32%, var(--color-card) 100%)',
        boxShadow: 'inset 0 0 60px -10px color-mix(in oklab, var(--color-accent) 35%, transparent)',
      }}
    >
      {/* El Olimpo: nubes y templo */}
      <svg viewBox="0 0 360 220" className="absolute inset-x-0 top-0 h-[220px] w-full" aria-hidden>
        <defs>
          <linearGradient id="olympus-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#c99a2e" />
          </linearGradient>
          <radialGradient id="olympus-glow">
            <stop offset="0%" stopColor="#fde68a" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#fde68a" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={180} cy={96} rx={130} ry={80} fill="url(#olympus-glow)" />
        {[
          [70, 170, 60],
          [290, 165, 66],
          [180, 188, 96],
          [30, 140, 36],
          [330, 132, 34],
        ].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r! * 0.28} className="fill-bg" opacity={0.85} />
        ))}
        <g transform="translate(180 50)">
          {/* Frontón */}
          <path d="M-70,24 L0,-12 L70,24 Z" fill="url(#olympus-gold)" />
          <path d="M-52,20 L0,-4 L52,20 Z" fill="#fef3c7" opacity={0.55} />
          <rect x={-74} y={24} width={148} height={8} rx={2} fill="url(#olympus-gold)" />
          {/* Columnas acanaladas */}
          {[-60, -36, -12, 12, 36, 60].map((x) => (
            <g key={x}>
              <rect x={x - 6} y={34} width={12} height={62} fill="#fef3c7" />
              <rect x={x - 2.5} y={36} width={1.5} height={58} fill="#e5c76b" opacity={0.7} />
              <rect x={x + 1} y={36} width={1.5} height={58} fill="#e5c76b" opacity={0.7} />
              <rect x={x - 8} y={32} width={16} height={4} rx={1} fill="url(#olympus-gold)" />
              <rect x={x - 8} y={95} width={16} height={4} rx={1} fill="url(#olympus-gold)" />
            </g>
          ))}
          {/* Escalinata */}
          <rect x={-80} y={99} width={160} height={7} rx={1.5} fill="url(#olympus-gold)" />
          <rect x={-88} y={106} width={176} height={7} rx={1.5} fill="#e5c76b" />
        </g>
      </svg>

      {/* Sendero */}
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <path
          d={pathOf(pts)}
          fill="none"
          className="stroke-accent/40"
          strokeWidth={6}
          strokeDasharray="1 14"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {done.length > 1 && (
          <path
            d={pathOf(done)}
            fill="none"
            className="stroke-gold"
            strokeWidth={6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Checkpoints */}
      {rows.map(({ camp, idx }, r) => {
        const reached = level.level >= camp.level
        const current = idx === journey.index
        const Icon = KIND_ICON[camp.kind]
        const text = j.camps[camp.id]
        const x = xAt(r)
        return (
          <div
            key={camp.id}
            ref={current ? currentRef : undefined}
            className="absolute flex w-0 flex-col items-center"
            style={{ left: `${x}%`, top: yAt(r) - 28 }}
          >
            {current && (
              <span className="absolute -top-12 block size-11 overflow-hidden rounded-full border-2 border-gold bg-card-2 shadow-[0_0_22px_rgb(250_204_21/0.45)]">
                <AvatarFigure avatar={avatar} variant="head" className="size-full" />
              </span>
            )}
            <button
              type="button"
              onClick={() => setOpen(camp.id)}
              aria-label={`${text?.name} · ${t.game.levelShort(camp.level)}`}
              className={cn(
                'relative grid size-14 shrink-0 place-items-center rounded-full border-b-4 transition-transform active:translate-y-0.5 active:border-b-2',
                camp.id === 'olympus'
                  ? reached
                    ? 'border-[color-mix(in_oklab,var(--color-gold)_70%,black)] bg-gold text-gold-fg shadow-[0_0_24px_rgb(250_204_21/0.5)]'
                    : 'border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-card))] bg-[color-mix(in_oklab,var(--color-accent)_14%,var(--color-card))] text-accent-2'
                  : reached
                    ? 'border-[color-mix(in_oklab,var(--color-gold)_70%,black)] bg-gold text-gold-fg'
                    : 'border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-card))] bg-[color-mix(in_oklab,var(--color-accent)_14%,var(--color-card))] text-accent-2',
                current && 'ring-4 ring-gold/30',
              )}
            >
              <Icon className="size-6" />
              {!reached && (
                <Lock className="absolute -right-1 -bottom-1 size-5 rounded-full border border-accent/30 bg-card p-0.5 text-accent-2" />
              )}
            </button>
            <span className="mt-1.5 w-28 text-center text-xs leading-tight">
              <span className={cn('block font-semibold', reached ? 'text-fg' : 'text-muted')}>
                {text?.name}
              </span>
              <span className="block num text-subtle">{t.game.levelShort(camp.level)}</span>
            </span>
          </div>
        )
      })}

      <CampSheet campId={open} level={level.level} onClose={() => setOpen(null)} />
    </div>
  )
}
