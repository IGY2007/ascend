import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Mountain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/ui/confetti'
import { Sheet } from '@/components/ui/sheet'
import { Mascot } from '@/features/avatar/Mascot'
import { useGameState } from '@/features/profile/hooks'
import { CAMPS } from '@/domain/journey'
import { t } from '@/i18n'

const KEY = 'ascend-camp-seen'
const j = t.journey

/** Festeja cuando llegás a un campamento nuevo de la montaña. */
export function CampWatcher() {
  const game = useGameState()
  const navigate = useNavigate()
  const [shown, setShown] = useState<number | null>(null)
  const index = game?.journey.index

  useEffect(() => {
    if (index === undefined) return
    const raw = localStorage.getItem(KEY)
    // La primera vez solo se anota dónde estás (no se festejan campamentos viejos)
    if (raw === null) {
      localStorage.setItem(KEY, String(index))
      return
    }
    if (index > Number(raw)) {
      localStorage.setItem(KEY, String(index))
      const id = window.setTimeout(() => setShown(index), 600)
      return () => window.clearTimeout(id)
    }
  }, [index])

  const camp = shown !== null ? CAMPS[shown] : null
  const text = camp ? j.camps[camp.id] : null

  return (
    <>
      {camp && <Confetti burstKey={`camp-${camp.id}`} />}
      <Sheet open={!!camp} onOpenChange={(o) => !o && setShown(null)} title={j.reached}>
        {camp && text && (
          <div className="flex flex-col items-center pt-2 pb-1 text-center">
            <Mascot size={110} pose="cheer" mood="proud" bounce />
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-success">
              <Mountain className="size-4" />
              {j.arrived} · {j.campOf((shown ?? 0) + 1, CAMPS.length)}
            </p>
            <h3 className="mt-1 text-3xl font-bold">{text.name}</h3>
            <p className="mt-2 text-muted">{text.era}</p>
            <Button
              size="lg"
              block
              className="mt-5"
              onClick={() => {
                setShown(null)
                navigate('/journey')
              }}
            >
              {j.read}
            </Button>
          </div>
        )}
      </Sheet>
    </>
  )
}
