import { useEffect } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  format?: (value: number) => string
  className?: string
  duration?: number
}

/** Número que se anima al cambiar (volumen, contadores). Respeta prefers-reduced-motion. */
export function AnimatedNumber({
  value,
  format = (v) => Math.round(v).toLocaleString('es-AR'),
  className,
  duration = 0.6,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, format)

  useEffect(() => {
    if (reduced) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [value, reduced, duration, mv])

  return <motion.span className={cn('num', className)}>{text}</motion.span>
}
