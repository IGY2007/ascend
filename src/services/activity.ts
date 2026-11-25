import { db } from '@/lib/db'
import { LOCAL_USER_ID } from '@/features/auth/auth-context'
import { cardioKcal, waterTargetMl, type CardioActivity, type Intensity } from '@/domain/cardio'
import { toDateKey } from '@/domain/dates'
import type { CardioLog, WaterLog } from '@/types/models'
import { bodyWeightService, nutritionService } from './local-data'

import { monotonicNowIso } from '@/lib/time'

const now = monotonicNowIso
const uuid = () => crypto.randomUUID()

async function currentWeight(): Promise<number> {
  const latest = await bodyWeightService.latest()
  if (latest) return latest.weightKg
  return (await db.profile.get('me'))?.weightKg ?? 70
}

export const cardioService = {
  /** Estima las calorías con el peso actual (para mostrar antes de guardar). */
  async estimate(activity: CardioActivity, intensity: Intensity, minutes: number): Promise<number> {
    return cardioKcal(activity, intensity, minutes, await currentWeight())
  },

  async log(input: {
    activity: CardioActivity
    intensity: Intensity
    minutes: number
    date?: string
    notes?: string | null
  }) {
    const ts = now()
    const kcal = cardioKcal(input.activity, input.intensity, input.minutes, await currentWeight())
    await db.cardioLogs.add({
      id: uuid(),
      userId: LOCAL_USER_ID,
      date: input.date ?? toDateKey(new Date()),
      activity: input.activity,
      intensity: input.intensity,
      minutes: Math.round(input.minutes),
      kcal,
      notes: input.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    })
    return kcal
  },

  byDate: (date: string): Promise<CardioLog[]> =>
    db.cardioLogs.where('date').equals(date).sortBy('createdAt'),
  all: (): Promise<CardioLog[]> => db.cardioLogs.orderBy('date').toArray(),
  remove: (id: string) => db.cardioLogs.delete(id),
}

export const waterService = {
  async add(ml: number, date = toDateKey(new Date())) {
    const ts = now()
    await db.waterLogs.add({
      id: uuid(),
      userId: LOCAL_USER_ID,
      date,
      ml: Math.round(ml),
      createdAt: ts,
      updatedAt: ts,
    })
  },
  byDate: (date: string): Promise<WaterLog[]> =>
    db.waterLogs.where('date').equals(date).sortBy('createdAt'),
  all: (): Promise<WaterLog[]> => db.waterLogs.orderBy('date').toArray(),
  /** Deshace el último vaso del día. */
  async undoLast(date = toDateKey(new Date())) {
    const last = (await waterService.byDate(date)).at(-1)
    if (last) await db.waterLogs.delete(last.id)
  },
  async target(): Promise<number> {
    return waterTargetMl(await currentWeight())
  },
}

export interface TodayEnergy {
  baseKcal: number
  cardioKcal: number
  totalKcal: number
}

/** Objetivo de calorías del día = objetivo base + lo gastado en cardio hoy. */
export async function todayEnergy(date = toDateKey(new Date())): Promise<TodayEnergy | null> {
  const goal = await nutritionService.current()
  if (!goal) return null
  const cardio = (await cardioService.byDate(date)).reduce((s, c) => s + c.kcal, 0)
  return { baseKcal: goal.kcal, cardioKcal: cardio, totalKcal: goal.kcal + cardio }
}
