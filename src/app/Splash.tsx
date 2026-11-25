import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { LOGO_PATHS } from '@/components/brand/logo-paths'
import { t } from '@/i18n'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Splash de arranque en frío (~1,1 s). El primer cuadro coincide con la pantalla de inicio estática
 * de iOS (mismo fondo, logo de 72 pt centrado), así no hay salto. No bloquea: se saltea tocando,
 * y la app se monta debajo mientras tanto. Se muestra una sola vez por carga.
 */
export function Splash() {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), reduced ? 250 : 1150)
    return () => window.clearTimeout(id)
  }, [reduced])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          role="presentation"
          aria-label={t.app.skipSplash}
          onPointerDown={() => setVisible(false)}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] bg-bg"
        >
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="absolute top-1/2 left-1/2 -mt-40 -ml-40 size-80 rounded-full bg-accent/22 blur-[80px]"
          />
          <div className="absolute top-1/2 left-1/2 -mt-[36px] -ml-[36px] size-[72px]">
            <motion.div
              initial={{ y: 0 }}
              animate={reduced ? undefined : { y: -22 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="size-full"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-full overflow-visible"
                fill="none"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points={LOGO_PATHS.peak} className="stroke-fg" />
                <motion.polyline
                  points={LOGO_PATHS.chevron}
                  className="stroke-accent"
                  initial={{ y: 0 }}
                  animate={reduced ? undefined : { y: [0, 3, -1.2, 0] }}
                  transition={{
                    duration: 0.75,
                    delay: 0.12,
                    times: [0, 0.3, 0.7, 1],
                    ease: 'easeInOut',
                  }}
                />
              </svg>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
              className="absolute top-full left-1/2 mt-1 -translate-x-1/2 text-sm font-semibold tracking-[0.42em] whitespace-nowrap text-fg"
              style={{ marginLeft: '0.21em' }}
            >
              ASCEND
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
