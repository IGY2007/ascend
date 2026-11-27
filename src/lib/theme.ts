/**
 * Tema de la app: oscuro (por defecto de la marca), claro o automático (sigue al iPhone).
 * Se aplica con data-theme en <html>; los colores salen de los tokens de index.css.
 * index.html aplica lo guardado antes del primer cuadro, para que no parpadee.
 */
export type ThemePref = 'dark' | 'light' | 'system'
export const THEME_PREFS: ThemePref[] = ['system', 'dark', 'light']
const KEY = 'ascend-theme'
const BG = { dark: '#09090b', light: '#f5f4f9' } as const

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' || v === 'system' ? v : 'system'
  } catch {
    return 'system'
  }
}

const media = () => window.matchMedia?.('(prefers-color-scheme: light)')

export function resolveTheme(pref: ThemePref = getThemePref()): 'dark' | 'light' {
  if (pref === 'system') return media()?.matches ? 'light' : 'dark'
  return pref
}

export function applyTheme(pref: ThemePref = getThemePref()) {
  const theme = resolveTheme(pref)
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BG[theme])
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme)
}

export function setThemePref(pref: ThemePref) {
  localStorage.setItem(KEY, pref)
  applyTheme(pref)
}

/** En automático, acompaña los cambios del iPhone (ej.: modo oscuro a la noche). */
export function watchSystemTheme() {
  const m = media()
  const onChange = () => {
    if (getThemePref() === 'system') applyTheme('system')
  }
  m?.addEventListener?.('change', onChange)
  return () => m?.removeEventListener?.('change', onChange)
}
