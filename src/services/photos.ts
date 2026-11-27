import { db } from '@/lib/db'
import { LOCAL_USER_ID } from '@/features/auth/auth-context'
import { toDateKey } from '@/domain/dates'
import type { Photo } from '@/types/models'

const MAX_EDGE = 1440

/** Achica una foto (las del iPhone pesan varios MB) y la pasa a JPEG. */
export async function downscale(
  file: Blob,
): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const ratio = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
    const width = Math.round(img.naturalWidth * ratio)
    const height = Math.round(img.naturalHeight * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
    if (!blob) throw new Error('no blob')
    return { blob, width, height }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const photoService = {
  list(): Promise<Photo[]> {
    return db.photos.orderBy('date').reverse().toArray()
  },

  /** Guarda una foto. Si ya hay una del mismo origen (volviste a compartir), la reemplaza. */
  async save(input: {
    blob: Blob
    width: number
    height: number
    kind: Photo['kind']
    sourceId?: string | null
    date?: string
  }): Promise<Photo> {
    const sourceId = input.sourceId ?? null
    const previous = sourceId
      ? await db.photos.where('sourceId').equals(sourceId).first()
      : undefined
    const photo: Photo = {
      id: previous?.id ?? crypto.randomUUID(),
      userId: LOCAL_USER_ID,
      date: input.date ?? toDateKey(new Date()),
      kind: input.kind,
      sourceId,
      blob: input.blob,
      width: input.width,
      height: input.height,
      createdAt: new Date().toISOString(),
    }
    await db.photos.put(photo)
    return photo
  },

  remove(id: string) {
    return db.photos.delete(id)
  },
}
