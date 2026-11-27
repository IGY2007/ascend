import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { photoService } from '@/services/photos'

export function usePhotos() {
  return useLiveQuery(() => photoService.list())
}

/** URL temporal para mostrar un Blob; se libera cuando cambia o al desmontar. */
export function useBlobUrl(blob: Blob | null | undefined) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    const u = blob ? URL.createObjectURL(blob) : null
    void Promise.resolve().then(() => !cancelled && setUrl(u))
    return () => {
      cancelled = true
      if (u) URL.revokeObjectURL(u)
    }
  }, [blob])
  return url
}
