import Dexie, { type EntityTable } from 'dexie'
import type {
  BodyWeight,
  Exercise,
  NutritionGoal,
  Profile,
  TemplateExercise,
  WorkoutTemplate,
} from '@/types/models'

/**
 * Base local (IndexedDB). En modo local es la única fuente de datos; con Supabase activo será la
 * fuente de verdad del dispositivo y se sincronizará con la nube.
 */
export class AscendDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  nutritionGoals!: EntityTable<NutritionGoal, 'id'>
  bodyWeights!: EntityTable<BodyWeight, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  templates!: EntityTable<WorkoutTemplate, 'id'>
  templateExercises!: EntityTable<TemplateExercise, 'id'>

  constructor(name = 'ascend') {
    super(name)
    this.version(1).stores({
      profile: 'id',
      nutritionGoals: 'id, effectiveFrom',
      bodyWeights: 'id, date',
      // Solo los ejercicios propios: la biblioteca global vive en src/data/global-exercises.ts
      exercises: 'id, name',
      templates: 'id, position',
      templateExercises: 'id, templateId, exerciseId',
    })
  }
}

export const db = new AscendDB()

/** Pide al navegador que no borre los datos locales por falta de espacio. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
