import { formatDecimal, formatSigned } from '@/domain/numbers'
import { t } from '@/i18n'
import type { Insights } from '@/services/stats'

export interface InsightMessage {
  key: string
  text: string
  positive: boolean
}

const i = t.insights

/** Convierte los datos de progreso en mensajes motivadores (solo los que tienen datos reales). */
export function insightMessages(d: Insights): InsightMessage[] {
  const out: InsightMessage[] = []
  if (d.weekGoal && d.weekGoal.goal > 0) {
    const done = d.weekGoal.done >= d.weekGoal.goal
    out.push({
      key: 'week',
      text: done ? i.weekDone(d.weekGoal.goal) : i.weekPending(d.weekGoal.done, d.weekGoal.goal),
      positive: done,
    })
  }
  if (d.recordsThisWeek > 0)
    out.push({ key: 'records', text: i.records(d.recordsThisWeek), positive: true })
  if (d.streak >= 2) out.push({ key: 'streak', text: i.streak(d.streak), positive: true })
  if (d.volumePct !== null && Math.abs(d.volumePct) >= 1) {
    const up = d.volumePct > 0
    out.push({
      key: 'volume',
      text: up
        ? i.volumeUp(formatDecimal(d.volumePct, 1))
        : i.volumeDown(formatDecimal(Math.abs(d.volumePct), 1)),
      positive: up,
    })
  }
  if (d.strength)
    out.push({
      key: 'strength',
      text: i.strength(
        d.strength.exerciseName,
        formatDecimal(d.strength.pct, 1),
        formatDecimal(d.strength.from, 1),
        formatDecimal(d.strength.to, 1),
      ),
      positive: true,
    })
  if (d.weightChange !== null && d.weightChange !== 0) {
    const up = d.weightChange > 0
    const onTrack =
      (up && (d.goal === 'muscle' || d.goal === 'strength')) ||
      (!up && (d.goal === 'fat_loss' || d.goal === 'recomp'))
    out.push({
      key: 'weight',
      text: onTrack
        ? i.weightOnTrack(formatDecimal(Math.abs(d.weightChange), 1), up)
        : i.weightNeutral(formatSigned(d.weightChange, 1)),
      positive: onTrack,
    })
  }
  if (d.cardio)
    out.push({
      key: 'cardio',
      text: i.cardio(d.cardio.minutes, formatDecimal(d.cardio.kcal, 0)),
      positive: true,
    })
  return out
}
