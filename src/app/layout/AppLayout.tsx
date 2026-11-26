import { useLocation, useOutlet } from 'react-router'
import { motion } from 'motion/react'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import { AchievementWatcher } from '@/features/game/AchievementWatcher'

/** Layout de las secciones principales: bottom nav en móvil, sidebar en desktop. */
export function AppLayout() {
  const outlet = useOutlet()
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh">
      <Sidebar />
      <main className="pt-safe pr-safe pb-[calc(4rem+env(safe-area-inset-bottom)+1.5rem)] pl-safe md:pb-10 md:pl-60">
        {/* Transición de entrada corta (solo opacity y transform). Sin salida: no hay espera. */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-2xl px-5 pt-6 md:px-8 md:pt-10"
        >
          {outlet}
        </motion.div>
      </main>
      <BottomNav />
      <AchievementWatcher />
    </div>
  )
}
