import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/** Números pseudoaleatorios a partir de una semilla (mismo key → misma explosión, render puro). */
function seeded(key: string | number) {
  let h = 2166136261
  for (const ch of String(key)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const COLORS = ['var(--color-accent)', 'var(--color-accent-2)', 'var(--color-success)', '#f4f4f5']

/**
 * Explosión de confeti para festejar (récords, logros). Sin librerías: ~40 piezas animadas con
 * motion. No se muestra si el usuario pidió reducir el movimiento.
 */
export function Confetti({ burstKey, count = 40 }: { burstKey: string | number; count?: number }) {
  const reduce = useReducedMotion()
  const pieces = useMemo(() => {
    const random = seeded(burstKey)
    return Array.from({ length: count }, (_, i) => {
      const angle = random() * Math.PI * 2
      const dist = 120 + random() * 220
      return {
        i,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 120,
        rotate: random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        w: 6 + random() * 6,
        h: 8 + random() * 10,
        delay: random() * 0.08,
      }
    })
  }, [burstKey, count])
  if (reduce) return null
  return (
    <div
      key={burstKey}
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.span
          key={p.i}
          className="absolute top-1/3 left-1/2 rounded-[2px]"
          style={{ width: p.w, height: p.h, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{
            x: p.x,
            y: [0, p.y, p.y + 260],
            opacity: [1, 1, 0],
            rotate: p.rotate,
            scale: 1,
          }}
          transition={{ duration: 1.6, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  )
}
