import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { downscale, photoService } from '@/services/photos'
import { t } from '@/i18n'
import { PhotoGrid } from './PhotoGrid'
import { usePhotos } from './hooks'

const g = t.gallery

/** Tu galería: las fotos que compartiste y tus fotos de progreso. Solo en el dispositivo. */
export function GalleryPage() {
  const navigate = useNavigate()
  const photos = usePhotos()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const add = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const img = await downscale(file)
      await photoService.save({ ...img, kind: 'progress' })
    } catch {
      toast.error(g.error)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <>
      <header className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t.common.back}
          className="-ml-2 grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">{g.title}</h1>
      </header>

      <Button block loading={busy} onClick={() => input.current?.click()}>
        <ImagePlus />
        {g.addProgress}
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void add(e.target.files?.[0])}
      />
      <p className="mt-2 mb-5 px-1 text-center text-xs text-subtle">{g.localOnly}</p>

      {photos === undefined ? (
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
      ) : photos.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{t.profilePage.galleryEmpty}</p>
      ) : (
        <PhotoGrid photos={photos} />
      )}
    </>
  )
}
