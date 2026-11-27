import { useState } from 'react'
import { Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Sheet } from '@/components/ui/sheet'
import { fromDateKey } from '@/domain/dates'
import { photoService } from '@/services/photos'
import { locale, t } from '@/i18n'
import type { Photo } from '@/types/models'
import { useBlobUrl } from './hooks'

const g = t.gallery
const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })

function Thumb({ photo, onOpen }: { photo: Photo; onOpen: () => void }) {
  const url = useBlobUrl(photo.blob)
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${g.kinds[photo.kind]} · ${dateFmt.format(fromDateKey(photo.date))}`}
      className="aspect-[4/5] overflow-hidden rounded-xl bg-card-2 transition-transform active:scale-[0.97]"
    >
      {url && <img src={url} alt="" className="size-full object-cover" loading="lazy" />}
    </button>
  )
}

/** Grilla de fotos de la galería; al tocar una se abre para verla, compartirla o borrarla. */
export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<Photo | null>(null)
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((p) => (
          <Thumb key={p.id} photo={p} onOpen={() => setOpen(p)} />
        ))}
      </div>
      <PhotoViewer photo={open} onClose={() => setOpen(null)} />
    </>
  )
}

function PhotoViewer({ photo, onClose }: { photo: Photo | null; onClose: () => void }) {
  const url = useBlobUrl(photo?.blob)
  const [confirm, setConfirm] = useState(false)

  const share = async () => {
    if (!photo) return
    const file = new File([photo.blob], `ascend-${photo.date}.jpg`, { type: 'image/jpeg' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    const a = document.createElement('a')
    a.href = url!
    a.download = file.name
    a.click()
  }

  return (
    <>
      <Sheet
        open={!!photo}
        onOpenChange={(o) => !o && onClose()}
        title={photo ? g.kinds[photo.kind] : ''}
        description={photo ? dateFmt.format(fromDateKey(photo.date)) : undefined}
      >
        {url && (
          <img
            src={url}
            alt=""
            className="mx-auto max-h-[58dvh] w-auto rounded-2xl object-contain"
          />
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            <Trash2 />
            {g.delete}
          </Button>
          <Button onClick={() => void share()}>
            <Share2 />
            {g.share}
          </Button>
        </div>
      </Sheet>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={g.deleteConfirm}
        description={g.deleteBody}
        confirmLabel={g.delete}
        destructive
        onConfirm={() => {
          if (!photo) return
          void photoService.remove(photo.id).then(() => toast.success(g.deleted))
          onClose()
        }}
      />
    </>
  )
}
