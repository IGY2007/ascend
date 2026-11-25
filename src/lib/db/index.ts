import Dexie, { type EntityTable } from 'dexie'
import type {
  BodyWeight,
  CardioLog,
  WaterLog,
  Exercise,
  ExerciseSet,
  NutritionGoal,
  Profile,
  SessionExercise,
  TemplateExercise,
  WorkoutSession,
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
  sessions!: EntityTable<WorkoutSession, 'id'>
  sessionExercises!: EntityTable<SessionExercise, 'id'>
  exerciseSets!: EntityTable<ExerciseSet, 'id'>
  cardioLogs!: EntityTable<CardioLog, 'id'>
  waterLogs!: EntityTable<WaterLog, 'id'>

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

    // v2: entrenamientos + rutinas en rotación (sin días fijos) + días por semana en el perfil.
    this.version(2)
      .stores({
        sessions: 'id, status, startedAt, templateId',
        sessionExercises: 'id, sessionId, exerciseId',
        exerciseSets: 'id, sessionId, sessionExerciseId',
      })
      .upgrade(async (tx) => {
        await tx
          .table('profile')
          .toCollection()
          .modify((p: Record<string, unknown>) => {
            if (typeof p.daysPerWeek !== 'number') {
              const days = Array.isArray(p.trainingDays) ? p.trainingDays.length : 3
              p.daysPerWeek = Math.min(6, Math.max(2, days))
              p.split = 'upper_lower'
              p.easeLegs = false
              delete p.trainingDays
            }
          })
        await tx
          .table('templates')
          .toCollection()
          .modify((t: Record<string, unknown>) => {
            if (t.source === 'generated') t.weekdays = []
          })
      })

    // v3: cardio y agua.
    this.version(3).stores({
      cardioLogs: 'id, date',
      waterLogs: 'id, date',
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
