import { en } from './en'

/** Active language. The rest of the app consumes `t`. */
export const t = en
export const locale = 'en-US'

const dateFormatter = new Intl.DateTimeFormat(locale, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const monthYearFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })

/** "Tuesday, November 25" */
export function formatLongDate(date: Date) {
  return dateFormatter.format(date)
}

/** "November 2026" */
export function formatMonthYear(date: Date) {
  return monthYearFormatter.format(date)
}
