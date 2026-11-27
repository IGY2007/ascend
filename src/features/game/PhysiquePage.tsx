import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { t } from '@/i18n'
import { PhysiqueTab } from './PhysiqueTab'

/** Tu físico: se abre tocando tu personaje en Inicio. */
export function PhysiquePage() {
  const navigate = useNavigate()
  return (
    <>
      <header className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t.common.back}
          className="-ml-2 grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">
          {t.game.muscles.title}
        </h1>
      </header>
      <PhysiqueTab />
    </>
  )
}
