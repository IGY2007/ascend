import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tip } from '@/components/ui/tip'
import {
  useAvatar,
  useAvatarProgress,
  useGameState,
  useLocalProfile,
} from '@/features/profile/hooks'
import { profileService } from '@/services/local-data'
import { FULL_BODY, type AvatarConfig } from '@/domain/avatar'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { AvatarFigure } from './AvatarFigure'
import { AvatarEditor } from './AvatarEditor'

const av = t.avatar

/** Crear o cambiar el personaje, viéndolo como está este mes o "a tope". */
export function AvatarEditorPage() {
  const navigate = useNavigate()
  const saved = useAvatar()
  const heightCm = useLocalProfile()?.heightCm
  const game = useGameState()
  const progress = useAvatarProgress()
  const [draft, setDraft] = useState<AvatarConfig | null>(null)
  const [preview, setPreview] = useState<'month' | 'max'>('month')

  if (!saved) return <Skeleton className="h-96 rounded-[var(--radius-card)]" />
  const value = draft ?? saved

  const save = async () => {
    await profileService.updateAvatar(value)
    toast.success(av.saved)
    navigate(-1)
  }

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
        <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">{av.editorTitle}</h1>
      </header>

      <Card highlight className="relative pt-4 pb-3">
        <div className="mx-auto flex w-max gap-1 rounded-full bg-bg-2/80 p-1" role="radiogroup">
          {(['month', 'max'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={preview === k}
              onClick={() => setPreview(k)}
              className={cn(
                'h-9 rounded-full px-4 text-sm font-semibold transition-colors',
                preview === k ? 'bg-accent text-accent-fg' : 'text-muted',
              )}
            >
              {av.preview[k]}
            </button>
          ))}
        </div>
        <AvatarFigure
          heightCm={heightCm}
          avatar={value}
          body={preview === 'max' ? FULL_BODY : game?.monthBody}
          jerseyNumber={progress.level}
          className="mx-auto mt-2 h-72 w-auto"
        />
      </Card>

      <Tip className="mt-4">{t.mascot.avatarIntro}</Tip>

      <div className="mt-6">
        <AvatarEditor value={value} onChange={setDraft} progress={progress} />
      </div>

      <Button size="lg" block className="mt-8" onClick={() => void save()}>
        {av.save}
      </Button>
    </>
  )
}
