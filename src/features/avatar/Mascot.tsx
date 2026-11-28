import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export type MascotMood = 'happy' | 'wink' | 'wow' | 'proud'
export type MascotPose = 'idle' | 'wave' | 'flex' | 'lift' | 'think' | 'cheer' | 'point'

const INK = '#1f1a17'
const LIME = '#facc15'
const ARM = '#7c3aed'
const ARM_DARK = '#5b21b6'

type Angles = [upper: number, fore: number]
/** Ángulos en grados desde "colgando"; positivo = hacia afuera del cuerpo. */
const POSES: Record<MascotPose, { l: Angles; r: Angles }> = {
  idle: { l: [22, 6], r: [22, 6] },
  wave: { l: [25, -35], r: [125, 165] },
  flex: { l: [95, 175], r: [95, 175] },
  lift: { l: [140, 178], r: [140, 178] },
  think: { l: [22, 6], r: [40, 158] },
  cheer: { l: [140, 150], r: [140, 150] },
  point: { l: [22, 6], r: [85, 92] },
}

const SHOULDER_Y = 66
const SHOULDER_GAP = 27
const LEN = 20

function seg(x: number, y: number, len: number, deg: number, side: -1 | 1) {
  const r = (deg * Math.PI) / 180
  return { x: x + side * Math.sin(r) * len, y: y + Math.cos(r) * len }
}

function armPoints(side: -1 | 1, a: Angles) {
  const s = { x: 60 + side * SHOULDER_GAP, y: SHOULDER_Y }
  const e = seg(s.x, s.y, LEN, a[0], side)
  const w = seg(e.x, e.y, LEN * 0.9, a[1], side)
  return { s, e, w }
}

function Arm({ side, angles }: { side: -1 | 1; angles: Angles }) {
  const { s, e, w } = armPoints(side, angles)
  // Bíceps: bulto del lado interno, cerca del codo
  const nx = -(e.y - s.y) / LEN
  const ny = (e.x - s.x) / LEN
  const b = {
    x: (s.x + e.x) / 2 - nx * side * 4.5 + (e.x - s.x) * 0.12,
    y: (s.y + e.y) / 2 - ny * side * 4.5 + (e.y - s.y) * 0.12,
  }
  const band = { x: (e.x + w.x * 3) / 4, y: (e.y + w.y * 3) / 4 }
  return (
    <g strokeLinecap="round">
      <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={ARM} strokeWidth={13} />
      <circle cx={b.x} cy={b.y} r={9.4} fill={ARM} />
      {/* Hombro */}
      <circle cx={s.x} cy={s.y} r={8.5} fill="#8b5cf6" />
      <circle cx={s.x - 2} cy={s.y - 2.5} r={2.6} fill="#fff" opacity={0.2} />
      <circle cx={b.x - 1.5} cy={b.y - 2.5} r={3.2} fill="#fff" opacity={0.18} />
      <line x1={e.x} y1={e.y} x2={w.x} y2={w.y} stroke={ARM} strokeWidth={10.6} />
      <circle cx={band.x} cy={band.y} r={6} fill={LIME} />
      <circle cx={w.x} cy={w.y} r={7.8} fill={ARM} stroke={ARM_DARK} strokeWidth={1.2} />
    </g>
  )
}

/** Brazo "cartoon": hombro, bíceps marcado, antebrazo y puño de guante. */
function CartoonArm({ side, angles }: { side: -1 | 1; angles: Angles }) {
  const { s, e, w } = armPoints(side, angles)
  const deg = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }, k = 0.5) => ({
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
  })
  const u = mid(s, e, 0.55)
  const f = mid(e, w, 0.5)
  const nx = -(e.y - s.y) / LEN
  const ny = (e.x - s.x) / LEN
  const bi = { x: u.x - nx * side * 3.2, y: u.y - ny * side * 3.2 }
  return (
    <g>
      <ellipse
        cx={u.x}
        cy={u.y}
        rx={LEN / 2 + 3}
        ry={7}
        transform={`rotate(${deg(s, e)} ${u.x} ${u.y})`}
        fill={ARM}
      />
      <ellipse
        cx={bi.x}
        cy={bi.y}
        rx={7.5}
        ry={6.2}
        transform={`rotate(${deg(s, e)} ${bi.x} ${bi.y})`}
        fill="#8b5cf6"
      />
      <ellipse
        cx={bi.x - 1.5}
        cy={bi.y - 2}
        rx={3}
        ry={1.8}
        transform={`rotate(${deg(s, e)} ${bi.x} ${bi.y})`}
        fill="#fff"
        opacity={0.25}
      />
      <ellipse
        cx={f.x}
        cy={f.y}
        rx={LEN * 0.45 + 2}
        ry={5.6}
        transform={`rotate(${deg(e, w)} ${f.x} ${f.y})`}
        fill={ARM}
      />
      <circle cx={s.x} cy={s.y} r={8.5} fill="#8b5cf6" />
      <circle cx={s.x - 2} cy={s.y - 2.5} r={2.6} fill="#fff" opacity={0.2} />
      {/* Guante */}
      <circle cx={w.x} cy={w.y} r={8.6} fill={LIME} />
      <path
        d={`M${w.x - 4.5},${w.y - 1.5} Q${w.x},${w.y - 4.5} ${w.x + 4.5},${w.y - 1.5}`}
        transform={`rotate(${deg(e, w) - 90} ${w.x} ${w.y})`}
        stroke="#4d7c0f"
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  )
}

function Dumbbell({ a, b }: { a: { x: number; y: number }; b: { x: number; y: number } }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const L = Math.hypot(dx, dy) || 1
  const [ux, uy] = [dx / L, dy / L]
  const p1 = { x: a.x - ux * 9, y: a.y - uy * 9 }
  const p2 = { x: b.x + ux * 9, y: b.y + uy * 9 }
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI
  return (
    <g>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="#a1a1aa"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {[p1, p2].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${angle})`}>
          <rect x={-3} y={-11} width={6} height={22} rx={2} fill="#3f3f46" />
          <rect x={i === 0 ? -7.5 : 3.5} y={-7.5} width={4} height={15} rx={1.5} fill="#52525b" />
        </g>
      ))}
    </g>
  )
}

/**
 * Volt, el coach de ASCEND: una bolita violeta musculosa con vincha, silbato y zapatillas.
 * Cambia de pose (saluda, saca bíceps, levanta la pesa, piensa, festeja, señala) y de cara.
 */
export function Mascot({
  size = 40,
  mood = 'happy',
  pose = 'idle',
  wave = false,
  bounce = false,
  look = 'classic',
  className,
}: {
  size?: number
  mood?: MascotMood
  pose?: MascotPose
  /** Atajo: pose de saludo con el brazo animado. */
  wave?: boolean
  /** Rebota suave (para las pantallas grandes). */
  bounce?: boolean
  /** 'cartoon' (con contorno tipo sticker y brazos con guantes) o 'classic'. */
  look?: 'cartoon' | 'classic'
  className?: string
}) {
  const id = useId()
  const reduce = useReducedMotion()
  const p = wave ? 'wave' : pose
  const angles = POSES[p]
  const l = armPoints(-1, angles.l)
  const r = armPoints(1, angles.r)
  const animateArm = p === 'wave' && !reduce && size >= 56

  return (
    <motion.svg
      viewBox="0 0 120 130"
      width={size}
      height={(size * 130) / 120}
      className={cn('shrink-0 overflow-visible', className)}
      aria-hidden
      animate={bounce && !reduce ? { y: [0, -3, 0] } : undefined}
      transition={bounce ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      <defs>
        <filter id={`${id}-o`} x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology operator="dilate" radius={2.2} in="SourceAlpha" result="d" />
          <feFlood floodColor="#f4f4f5" />
          <feComposite in2="d" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`${id}-b`} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="60%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
      </defs>

      {/* Sombra en el piso */}
      <ellipse cx={60} cy={125} rx={26} ry={3.5} fill="#000" opacity={0.25} />
      <g filter={look === 'cartoon' ? `url(#${id}-o)` : undefined}>
        {/* Piernas y zapatillas */}
        {[-1, 1].map((s) => {
          const x = 60 + s * 11
          return (
            <g key={s}>
              <rect x={x - 5} y={90} width={10} height={20} rx={5} fill={ARM_DARK} />
              <path
                d={`M${x - 9},${118} Q${x - 10},${110} ${x - 3},${109} L${x + 3},${109} Q${x + 11},${111} ${x + 10},${118} Z`}
                fill="#f4f4f5"
              />
              <rect x={x - 10} y={117} width={20} height={4.5} rx={2.2} fill={LIME} />
              <path
                d={`M${x - 3},${112} L${x + 3},${112} M${x - 3},${114.5} L${x + 3},${114.5}`}
                stroke="#a1a1aa"
                strokeWidth={1}
              />
            </g>
          )
        })}

        {/* Cuerpo */}
        <circle cx={60} cy={66} r={32} fill={`url(#${id}-b)`} />
        <ellipse cx={49} cy={46} rx={11} ry={5.5} fill="#fff" opacity={0.22} />
        {/* Abdominales marcados */}
        <g stroke={ARM_DARK} strokeWidth={1.3} strokeLinecap="round" opacity={0.45} fill="none">
          <path d="M60,86 L60,95" />
          <path d="M53,89 Q56,90.5 59,89 M61,89 Q64,90.5 67,89" />
        </g>
        {/* Vincha con nudo */}
        <path d="M28,52 Q60,30 92,52 L92,60 Q60,39 28,60 Z" fill={LIME} />
        <path d="M90,53 L103,46 L100,58 Z" fill={LIME} />
        <path d="M90,56 L101,62 L94,64 Z" fill="#84cc16" />

        {/* Cara */}
        {[-1, 1].map((s) =>
          mood === 'wink' && s === -1 ? (
            <path
              key={s}
              d="M44,68 Q50,63 56,68"
              stroke={INK}
              strokeWidth={2.8}
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            <g key={s}>
              <ellipse
                cx={60 + s * 10}
                cy={68}
                rx={5.4}
                ry={mood === 'wow' ? 7.2 : 6.2}
                fill="#fff"
              />
              <circle cx={60 + s * 10 + 1} cy={69} r={3.1} fill={INK} />
              <circle cx={60 + s * 10 + 2.1} cy={67.3} r={1.1} fill="#fff" />
            </g>
          ),
        )}
        {/* Cejas decididas */}
        {[-1, 1].map((s) => (
          <path
            key={s}
            d={`M${60 + s * 16},${mood === 'wow' ? 56 : 58} L${60 + s * 6},${mood === 'proud' ? 59 : 61}`}
            stroke={INK}
            strokeWidth={2.8}
            strokeLinecap="round"
          />
        ))}
        <circle cx={42} cy={77} r={3.4} fill="#f472b6" opacity={0.3} />
        <circle cx={78} cy={77} r={3.4} fill="#f472b6" opacity={0.3} />
        {mood === 'wow' ? (
          <ellipse cx={60} cy={81} rx={3.6} ry={4.6} fill={INK} />
        ) : mood === 'proud' ? (
          <g>
            <path d="M50,78 Q60,90 70,78 Z" fill={INK} />
            <path d="M52.5,79.2 L67.5,79.2" stroke="#fff" strokeWidth={2.2} />
          </g>
        ) : (
          <path
            d="M52,79 Q60,86.5 68,79"
            stroke={INK}
            strokeWidth={2.8}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Silbato */}
        <path d="M41,88 Q60,99 79,88" stroke="#f4f4f5" strokeWidth={1.4} fill="none" />
        <rect x={71} y={90} width={10} height={6.5} rx={2.2} fill="#d4d4d8" />
        <circle cx={73.5} cy={93.2} r={1.3} fill="#71717a" />

        {/* Brazos (adelante) */}
        {look === 'cartoon' ? (
          <CartoonArm side={-1} angles={angles.l} />
        ) : (
          <Arm side={-1} angles={angles.l} />
        )}
        {animateArm ? (
          <motion.g
            style={{ transformBox: 'view-box', transformOrigin: `${r.s.x}px ${r.s.y}px` }}
            animate={{ rotate: [0, -14, 6, -14, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1.4 }}
          >
            {look === 'cartoon' ? (
              <CartoonArm side={1} angles={angles.r} />
            ) : (
              <Arm side={1} angles={angles.r} />
            )}
          </motion.g>
        ) : look === 'cartoon' ? (
          <CartoonArm side={1} angles={angles.r} />
        ) : (
          <Arm side={1} angles={angles.r} />
        )}
        {p === 'lift' && <Dumbbell a={l.w} b={r.w} />}
      </g>
    </motion.svg>
  )
}
