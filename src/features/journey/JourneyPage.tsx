import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useGameState } from '@/features/profile/hooks'
import { CAMPS } from '@/domain/journey'
import { t } from '@/i18n'
import { JourneyMap } from './JourneyMap'

const j = t.journey

/** El viaje en pantalla completa (se abre desde el festejo de un checkpoint nuevo). */
export function JourneyPage() {
  const navigate = useNavigate()
  const game = useGameState()
  return (
    <>
      <header className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t.common.back}
          className="-ml-2 grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <ChevronLeft className="size-6" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">{j.title}</h1>
          {game && (
            <p className="text-sm text-muted">
              {j.campOf(game.journey.index + 1, CAMPS.length)} ·{' '}
              {j.camps[game.journey.current.id]?.name}
            </p>
          )}
        </div>
      </header>
      <JourneyMap />
    </>
  )
}
