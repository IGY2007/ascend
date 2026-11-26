import { useId } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export type MascotMood = 'happy' | 'wink' | 'wow' | 'proud'

/**
 * Volt, la mascota de ASCEND: una bolita violeta con vincha verde y un rayo en la panza.
 * Saluda en el cuestionario y da los consejos desde un costadito.
 */
export function Mascot({
  size = 40,
  mood = 'happy',
  wave = false,
  className,
}: {
  size?: number
  mood?: MascotMood
  /** Saluda con el brazo (animado, salvo que se pida reducir el movimiento). */
  wave?: boolean
  className?: string
}) {
  const id = useId()
  const reduce = useReducedMotion()
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn('shrink-0 overflow-visible', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Pies */}
      <ellipse cx={38} cy={91} rx={9} ry={5} fill="#5b21b6" />
      <ellipse cx={62} cy={91} rx={9} ry={5} fill="#5b21b6" />
      {/* Brazo izquierdo (flexionando) */}
      <circle cx={13} cy={62} r={8} fill="#7c3aed" />
      {/* Brazo derecho: saluda */}
      <motion.g
        style={{ originX: '78px', originY: '58px' }}
        animate={wave && !reduce ? { rotate: [0, -22, 8, -22, 0] } : undefined}
        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2 }}
      >
        <circle cx={88} cy={40} r={8} fill="#7c3aed" />
      </motion.g>
      {/* Cuerpo */}
      <circle cx={50} cy={56} r={34} fill={`url(#${id}-b)`} />
      <ellipse cx={40} cy={36} rx={12} ry={6} fill="#fff" opacity={0.18} />
      {/* Vincha */}
      <path d="M17,42 Q50,20 83,42 L83,50 Q50,29 17,50 Z" fill="#a3e635" />
      <path d="M81,44 L94,38 L90,48 Z" fill="#a3e635" />
      {/* Ojos */}
      {mood === 'wink' ? (
        <path
          d="M30,57 Q38,51 46,57"
          stroke="#1f1a17"
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <g>
          <ellipse cx={38} cy={57} rx={8.5} ry={mood === 'wow' ? 11 : 9.5} fill="#fff" />
          <circle cx={40} cy={59} r={4.6} fill="#1f1a17" />
          <circle cx={41.6} cy={57} r={1.6} fill="#fff" />
        </g>
      )}
      <ellipse cx={62} cy={57} rx={8.5} ry={mood === 'wow' ? 11 : 9.5} fill="#fff" />
      <circle cx={64} cy={59} r={4.6} fill="#1f1a17" />
      <circle cx={65.6} cy={57} r={1.6} fill="#fff" />
      {/* Boca */}
      {mood === 'wow' ? (
        <ellipse cx={51} cy={75} rx={4.5} ry={5.5} fill="#1f1a17" />
      ) : (
        <path
          d={mood === 'proud' ? 'M39,71 Q51,84 63,71 Z' : 'M41,72 Q51,81 61,72'}
          stroke="#1f1a17"
          strokeWidth={3.2}
          fill={mood === 'proud' ? '#1f1a17' : 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Rayo */}
      <path d="M53,80 L46,90 L51,90 L48,97 L57,86 L52,86 Z" fill="#a3e635" />
    </svg>
  )
}
