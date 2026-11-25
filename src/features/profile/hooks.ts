import { useLiveQuery } from 'dexie-react-hooks'
import {
  bodyWeightService,
  exercisesService,
  nutritionService,
  profileService,
  templatesService,
} from '@/services/local-data'
import { historyService, workoutService } from '@/services/workout'

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
