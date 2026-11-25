import { useSyncExternalStore } from 'react'

/** Perfil del modo local (sin cuenta): se guarda en el dispositivo. */
const NAME_KEY = 'ascend-local-name'
const SINCE_KEY = 'ascend-local-since'

const listeners = new Set<() => void>()

export function getLocalName(): string | null {
  return localStorage.getItem(NAME_KEY)
}

export function setLocalName(name: string) {
  const trimmed = name.trim().slice(0, 60)
  if (trimmed) localStorage.setItem(NAME_KEY, trimmed)
  else localStorage.removeItem(NAME_KEY)
  listeners.forEach((l) => l())
}

/** Fecha del primer uso en este dispositivo (se fija la primera vez que se consulta). */
export function getLocalSince(): string {
  let since = localStorage.getItem(SINCE_KEY)
  if (!since) {
    since = new Date().toISOString()
    localStorage.setItem(SINCE_KEY, since)
  }
  return since
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => e.key === NAME_KEY && listener()
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useLocalName(): string | null {
  return useSyncExternalStore(subscribe, getLocalName, () => null)
}
