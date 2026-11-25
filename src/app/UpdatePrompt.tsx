import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'
import { t } from '@/i18n'

const UPDATE_CHECK_MS = 60 * 60 * 1000

/** Registra el service worker y avisa cuando hay una versión nueva (iOS no la aplica solo). */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      window.setInterval(() => {
        if (navigator.onLine) void registration.update()
      }, UPDATE_CHECK_MS)
    },
  })

  useEffect(() => {
    if (!needRefresh) return
    toast(t.pwa.updateAvailable, {
      id: 'pwa-update',
      duration: Infinity,
      action: { label: t.pwa.update, onClick: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker])

  return null
}
