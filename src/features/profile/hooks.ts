import { useLiveQuery } from 'dexie-react-hooks'
import {
  bodyWeightService,
  nutritionService,
  profileService,
  templatesService,
} from '@/services/local-data'

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
