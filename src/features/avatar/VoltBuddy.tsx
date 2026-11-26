import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Mascot, type MascotMood, type MascotPose } from './Mascot'
import {
  useGameState,
  useHistory,
  useLocalProfile,
  useNextTemplateId,
  useTemplates,
  useTodayWater,
  useWaterTarget,
} from '@/features/profile/hooks'
import { startOfWeek, toDateKey } from '@/domain/dates'
import { t } from '@/i18n'

const b = t.buddy
const LAST_KEY = 'ascend-volt-last'
/** Cada cuánto puede aparecer como mucho. */
const COOLDOWN_MS = 20 * 60 * 1000
const SHOW_AFTER_MS = 2200
const HIDE_AFTER_MS = 14000

interface Line {
  text: string
  pose: MascotPose
  mood: MascotMood
}

const LEGS = /leg|lower|pierna|inferior/i

/**
 * Volt, en la esquina de abajo a la derecha: cada tanto aparece con un comentario según cómo
 * venís (día de piernas, si ya entrenaste, el finde, el agua…). Tocándolo se va.
 */
export function VoltBuddy() {
  const { pathname } = useLocation()
  const history = useHistory()
  const game = useGameState()
  const profile = useLocalProfile()
  const templates = useTemplates()
  const nextId = useNextTemplateId()
  const today = toDateKey(new Date())
  const water = useTodayWater(today)
  const waterTarget = useWaterTarget()
  const [visible, setVisible] = useState<{ path: string; line: Line } | null>(null)

  const ready = history !== undefined && game !== undefined && profile !== undefined
  const line = useMemo<Line | null>(() => {
    if (!ready || !game) return null
    const now = new Date()
    const hour = now.getHours()
    const dow = now.getDay()
    const weekStart = toDateKey(startOfWeek(now))
    const sessions = history ?? []
    const trainedToday = sessions.some((s) => toDateKey(new Date(s.startedAt)) === today)
    const doneWeek = new Set(
      sessions
        .filter((s) => toDateKey(new Date(s.startedAt)) >= weekStart)
        .map((s) => toDateKey(new Date(s.startedAt))),
    ).size
    const goal = profile?.daysPerWeek ?? 3
    const next = templates?.find((x) => x.id === nextId)
    const legsNext = !!next && LEGS.test(next.name)
    const legsLagging =
      game.monthBody.legs + 0.35 < Math.max(game.monthBody.chest, game.monthBody.arms)

    const pool: Line[] = []
    if (doneWeek >= goal) pool.push({ text: b.weekDone, pose: 'cheer', mood: 'proud' })
    if (trainedToday) pool.push({ text: b.trainedToday, pose: 'flex', mood: 'proud' })
    if (!trainedToday && legsNext) pool.push({ text: b.legsDay, pose: 'point', mood: 'wink' })
    if (legsLagging) pool.push({ text: b.chickenLegs, pose: 'think', mood: 'wow' })
    if (dow === 5 || dow === 6) pool.push({ text: b.weekend, pose: 'wave', mood: 'wink' })
    if (!trainedToday && doneWeek < goal && hour >= 17)
      pool.push({ text: b.notYetEvening, pose: 'point', mood: 'happy' })
    if (!trainedToday && hour < 11)
      pool.push({ text: b.notYetMorning, pose: 'wave', mood: 'happy' })
    if (waterTarget && (water ?? 0) < waterTarget * 0.4 && hour >= 14)
      pool.push({ text: b.water, pose: 'think', mood: 'happy' })
    if (pathname.startsWith('/nutrition'))
      pool.unshift({ text: b.nutrition, pose: 'think', mood: 'happy' })
    if (pathname.startsWith('/progress'))
      pool.unshift({ text: b.progress, pose: 'point', mood: 'happy' })
    if (!trainedToday && pathname.startsWith('/workouts'))
      pool.unshift({
        text: t.home.coachTips[now.getDate() % t.home.coachTips.length]!,
        pose: 'think',
        mood: 'happy',
      })
    pool.push(
      { text: b.lazy, pose: 'flex', mood: 'wink' },
      { text: b.oneMore, pose: 'lift', mood: 'proud' },
    )
    // Rota entre los primeros que aplican, para no repetir siempre el mismo
    const pickFrom = pool.slice(0, 3)
    return pickFrom[(now.getHours() + pathname.length) % pickFrom.length]!
  }, [ready, game, history, profile, templates, nextId, water, waterTarget, pathname, today])

  // Aparece un rato después de entrar a una pantalla, si pasó el tiempo mínimo desde la última vez
  useEffect(() => {
    // En Inicio, Volt ya está junto a tu personaje
    if (!line || pathname === '/' || pathname.startsWith('/avatar')) return
    let last = 0
    try {
      last = Number(localStorage.getItem(LAST_KEY) ?? 0)
    } catch {
      /* sin almacenamiento */
    }
    if (Date.now() - last < COOLDOWN_MS) return
    const show = window.setTimeout(() => {
      localStorage.setItem(LAST_KEY, String(Date.now()))
      setVisible({ path: pathname, line })
    }, SHOW_AFTER_MS)
    return () => window.clearTimeout(show)
    // Solo al cambiar de pantalla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, line !== null])

  useEffect(() => {
    if (!visible) return
    const hide = window.setTimeout(() => setVisible(null), HIDE_AFTER_MS)
    return () => window.clearTimeout(hide)
  }, [visible])

  const shown = visible && visible.path === pathname ? visible.line : null

  return (
    <AnimatePresence>
      {shown && (
        <motion.button
          type="button"
          onClick={() => setVisible(null)}
          aria-label={b.close}
          initial={{ opacity: 0, x: 40, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed right-2 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)] z-40 flex max-w-[min(22rem,calc(100vw-1rem))] items-end gap-1 text-left md:bottom-6"
        >
          <span className="mb-6 rounded-2xl rounded-br-md border border-accent/40 bg-card-2/95 px-3.5 py-2.5 text-sm leading-snug shadow-[0_12px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur">
            <span className="block text-xs font-semibold text-accent-2">{t.mascot.name}</span>
            {shown.text}
          </span>
          <Mascot size={74} pose={shown.pose} mood={shown.mood} bounce />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
