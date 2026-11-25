import { es } from './es'

/** Idioma activo. Por ahora solo español; el resto de la app consume `t`. */
export const t = es
export const locale = 'es-AR'

const dateFormatter = new Intl.DateTimeFormat(locale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const monthYearFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })

/** "martes 25 de noviembre" */
export function formatLongDate(date: Date) {
  return dateFormatter.format(date)
}

/** "noviembre de 2026" */
export function formatMonthYear(date: Date) {
  return monthYearFormatter.format(date)
}
