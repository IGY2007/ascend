import { en, type Messages } from './en'
import { es } from './es'

/**
 * Idioma activo. Español por defecto; se cambia desde Perfil y queda guardado en el dispositivo.
 * Se elige al cargar la app (los textos se leen una vez), por eso cambiarlo recarga la página.
 */
export type Lang = 'es' | 'en'
export const LANGS: Lang[] = ['es', 'en']
const KEY = 'ascend-lang'

function readLang(): Lang {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

export const lang: Lang = readLang()
export const t: Messages = lang === 'en' ? en : es
export const locale = lang === 'en' ? 'en-US' : 'es-AR'
document.documentElement.lang = lang

export function setLanguage(next: Lang) {
  if (next === lang) return
  localStorage.setItem(KEY, next)
  window.location.reload()
}

const dateFormatter = new Intl.DateTimeFormat(locale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const monthYearFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })

/** "martes 25 de noviembre" / "Tuesday, November 25" */
export function formatLongDate(date: Date) {
  return dateFormatter.format(date)
}

/** "noviembre de 2026" / "November 2026" */
export function formatMonthYear(date: Date) {
  return monthYearFormatter.format(date)
}
