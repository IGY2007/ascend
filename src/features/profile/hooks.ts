import { useLiveQuery } from 'dexie-react-hooks'
import {
  bodyWeightService,
  exercisesService,
  nutritionService,
  profileService,
  templatesService,
} from '@/services/local-data'
import { historyService, workoutService } from '@/services/workout'
import { cardioService, todayEnergy, waterService } from '@/services/activity'
import { statsService } from '@/services/stats'
import { calendarService } from '@/services/calendar'
import { db } from '@/lib/db'

/** undefined = cargando · null = todavía no hizo el cuestionario */
export function useLocalProfile() {
  return useLiveQuery(async () => (await profileService.get()) ?? null)
}

export function useNutritionGoal() {
  return useLiveQuery(async () => (await nutritionService.current()) ?? null)
}

/** Del más reciente al más viejo. undefined mientras carga. */
export function useBodyWeights() {
  return useLiveQuery(() => bodyWeightService.list())
}

export function useTemplates() {
  return useLiveQuery(() => templatesService.list())
}

export function useLatestWeight() {
  return useLiveQuery(async () => (await bodyWeightService.latest()) ?? null)
}

export function useExerciseLibrary() {
  return useLiveQuery(() => exercisesService.all())
}

/** Entrenamiento en curso (undefined = cargando, null = ninguno). */
export function useActiveSession() {
  return useLiveQuery(async () => (await workoutService.active()) ?? null)
}

export function useSessionView(id: string | undefined) {
  return useLiveQuery(async () => (id ? ((await workoutService.view(id)) ?? null) : null), [id])
}

export function useNextTemplateId() {
  return useLiveQuery(() => workoutService.nextTemplateId())
}

export function useHistory() {
  return useLiveQuery(() => historyService.list())
}

export function useSessionSummary(id: string | undefined) {
  return useLiveQuery(async () => (id ? ((await historyService.summary(id)) ?? null) : null), [id])
}

export function useTodayCardio(date: string) {
  return useLiveQuery(() => cardioService.byDate(date), [date])
}

export function useTodayWater(date: string) {
  return useLiveQuery(
    async () => (await waterService.byDate(date)).reduce((s, w) => s + w.ml, 0),
    [date],
  )
}

export function useWaterTarget() {
  return useLiveQuery(() => waterService.target())
}

export function useTodayEnergy(date: string) {
  return useLiveQuery(async () => (await todayEnergy(date)) ?? null, [date])
}

export function useInsights(today: string) {
  return useLiveQuery(() => statsService.insights(today), [today])
}

export function useWeeklyStats(today: string) {
  return useLiveQuery(() => statsService.weekly(today, 8), [today])
}

export function useWaterDaily(today: string) {
  return useLiveQuery(() => statsService.waterDaily(today, 14), [today])
}

export function useExercisesDone() {
  return useLiveQuery(() => statsService.exercisesDone())
}

export function useExerciseHistory(exerciseId: string | null) {
  return useLiveQuery(
    async () => (exerciseId ? statsService.exerciseHistory(exerciseId) : []),
    [exerciseId],
  )
}

export function useCardioLogs() {
  return useLiveQuery(async () => (await cardioService.all()).reverse())
}

export function useDaySessions(date: string) {
  return useLiveQuery(() => historyService.byDate(date), [date])
}

/** Peso registrado ese día (null si no hay). */
export function useDayWeight(date: string) {
  return useLiveQuery(
    async () => (await db.bodyWeights.where('date').equals(date).first()) ?? null,
    [date],
  )
}

export function useCalendarRange(from: string, to: string) {
  return useLiveQuery(() => calendarService.range(from, to), [from, to])
}
