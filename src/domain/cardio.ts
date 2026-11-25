/**
 * Gasto de energía del cardio con METs (Compendium of Physical Activities):
 * kcal = MET × peso (kg) × horas. Es una estimación.
 */
export type CardioActivity =
  | 'football'
  | 'cycling'
  | 'running'
  | 'walking'
  | 'swimming'
  | 'padel'
  | 'basketball'
  | 'hiit'
  | 'elliptical'
  | 'rowing'
  | 'jump_rope'
  | 'other'

export type Intensity = 'light' | 'moderate' | 'vigorous'

/** MET por actividad e intensidad. */
export const METS: Record<CardioActivity, Record<Intensity, number>> = {
  football: { light: 5, moderate: 7, vigorous: 10 },
  cycling: { light: 4, moderate: 6.8, vigorous: 10 },
  running: { light: 7, moderate: 9.8, vigorous: 12 },
  walking: { light: 2.8, moderate: 3.5, vigorous: 5 },
  swimming: { light: 5.8, moderate: 7, vigorous: 9.8 },
  padel: { light: 4.5, moderate: 6, vigorous: 8 },
  basketball: { light: 4.5, moderate: 6.5, vigorous: 8 },
  hiit: { light: 6, moderate: 8, vigorous: 10 },
  elliptical: { light: 4.5, moderate: 5, vigorous: 7 },
  rowing: { light: 4.8, moderate: 7, vigorous: 8.5 },
  jump_rope: { light: 8.8, moderate: 11, vigorous: 12.3 },
  other: { light: 3.5, moderate: 5, vigorous: 7 },
}

export function cardioKcal(
  activity: CardioActivity,
  intensity: Intensity,
  minutes: number,
  weightKg: number,
): number {
  if (minutes <= 0 || weightKg <= 0) return 0
  return Math.round(METS[activity][intensity] * weightKg * (minutes / 60))
}

/** Objetivo de agua: 35 ml por kg, redondeado a 250 ml (orientativo). */
export function waterTargetMl(weightKg: number): number {
  return Math.round((weightKg * 35) / 250) * 250
}
