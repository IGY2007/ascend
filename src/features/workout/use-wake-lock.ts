import { useEffect } from 'react'

/**
 * Mantiene la pantalla encendida durante el entrenamiento (Wake Lock API, iOS 16.4+).
 * iOS libera el bloqueo al pasar a segundo plano: se vuelve a pedir al volver.
 */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const request = async () => {
      try {
        if (document.visibilityState !== 'visible') return
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) void lock.release()
      } catch {
        /* no disponible o denegado: no pasa nada */
      }
    }
    void request()
    const onVisible = () => void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [enabled])
}
