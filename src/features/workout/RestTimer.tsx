import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { formatDuration, restRemaining } from '@/domain/workout'
import { t } from '@/i18n'

export interface RestState {
  endsAt: number
  total: number
}

/** Pitido corto con Web Audio (la Vibration API no existe en iOS). */
function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => void ctx.close()
  } catch {
    /* sin audio */
  }
  navigator.vibrate?.(200)
}

/**
 * Temporizador de descanso. Guarda la HORA DE FIN y calcula lo que falta: iOS congela el JS en
 * segundo plano, así que nunca se confía en contar con setInterval.
 */
export function RestTimer({
  rest,
  onChange,
}: {
  rest: RestState | null
  onChange: (r: RestState | null) => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const [finished, setFinished] = useState(false)
  const firedFor = useRef<number | null>(null)

  useEffect(() => {
    if (!rest) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [rest])

  const remaining = rest ? restRemaining(rest.endsAt, now) : 0

  useEffect(() => {
    if (!rest || remaining > 0 || firedFor.current === rest.endsAt) return
    firedFor.current = rest.endsAt
    beep()
    setFinished(true)
    const id = window.setTimeout(() => {
      setFinished(false)
      onChange(null)
    }, 2500)
    return () => window.clearTimeout(id)
  }, [rest, remaining, onChange])

  // Un consejo distinto en cada descanso (fijo mientras dura ese descanso)
  const tips = t.workout.restTips
  // Cada tres descansos, Volt te recuerda tomar agua (en vez de llevar la cuenta del agua)
  const restIndex = rest ? Math.floor(rest.endsAt / 1000) : 0
  const tip = rest
    ? restIndex % 3 === 0
      ? t.workout.waterReminder
      : tips[restIndex % tips.length]
    : null

  const progress = rest ? Math.min(1, Math.max(0, remaining / rest.total)) : 0

  return (
    <AnimatePresence>
      {rest && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-accent/40 bg-card-2"
          role="timer"
          aria-live="polite"
        >
          <div
            className="absolute inset-y-0 left-0 w-full origin-left bg-accent/18 transition-transform duration-300 ease-linear"
            style={{ transform: `scaleX(${progress})` }}
          />
          {!finished && (
            <p className="relative px-4 pt-2.5 text-xs leading-snug text-muted">
              <span className="font-semibold text-success">{t.workout.restTipLabel}: </span>
              {tip}
            </p>
          )}
          <div className="relative flex items-center gap-2 px-3 py-2">
            <div className="min-w-0 flex-1 pl-1">
              <p className="text-xs font-medium text-accent-2">
                {finished ? t.workout.restDone : t.workout.rest}
              </p>
              <motion.p
                key={finished ? 'done' : 'run'}
                animate={finished ? { scale: [1, 1.08, 1] } : undefined}
                className="num text-2xl leading-tight font-bold"
              >
                {formatDuration(remaining)}
              </motion.p>
            </div>
            {!finished && (
              <>
                <TimerButton
                  onClick={() =>
                    onChange({
                      endsAt: Math.max(Date.now(), rest.endsAt - 15_000),
                      total: rest.total,
                    })
                  }
                >
                  −15
                </TimerButton>
                <TimerButton
                  onClick={() => onChange({ endsAt: rest.endsAt + 15_000, total: rest.total + 15 })}
                >
                  +15
                </TimerButton>
                <TimerButton onClick={() => onChange(null)}>{t.workout.skip}</TimerButton>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TimerButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 min-w-11 rounded-xl bg-bg/60 px-3 num text-sm font-semibold transition-transform active:scale-95"
    >
      {children}
    </button>
  )
}
