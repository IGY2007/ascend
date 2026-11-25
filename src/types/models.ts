/**
 * Modelos de la app (camelCase). Se guardan en Dexie y, cuando se active Supabase, se mapean a las
 * tablas de supabase/migrations/. Todos los registros propios llevan id UUID de cliente, userId y
 * updatedAt para que la sincronización futura sea un upsert idempotente.
 */

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'full_body'
  | 'other'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'smith'
  | 'other'

export type ExerciseType = 'weighted' | 'bodyweight' | 'timed'

export interface Exercise {
  id: string
  /** null = ejercicio global de la biblioteca */
  ownerUserId: string | null
  name: string
  primaryMuscle: MuscleGroup | null
  equipment: Equipment | null
  exerciseType: ExerciseType
}

// ---- Perfil y cuestionario ----

export type Sex = 'male' | 'female'
export type Goal = 'muscle' | 'fat_loss' | 'recomp' | 'strength'
export type ActivityLevel = 'sedentary' | 'light' | 'active' | 'very_active'
export type Experience = 'beginner' | 'intermediate' | 'advanced'
export type TrainingPlace = 'gym' | 'home'
/** 0 = domingo … 6 = sábado (igual que Date.getDay()) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface OnboardingAnswers {
  name: string
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  goal: Goal
  targetWeightKg: number | null
  activity: ActivityLevel
  experience: Experience
  trainingDays: Weekday[]
  sessionMinutes: number
  place: TrainingPlace
}

export interface Profile extends OnboardingAnswers {
  /** Siempre 'me' en modo local (un solo perfil por dispositivo). */
  id: 'me'
  userId: string
  completedAt: string
  updatedAt: string
}

// ---- Nutrición ----

export interface MacroTargets {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface NutritionGoal extends MacroTargets {
  id: string
  userId: string
  /** Fecha local AAAA-MM-DD desde la que rige */
  effectiveFrom: string
  source: 'questionnaire' | 'manual'
  createdAt: string
  updatedAt: string
}

// ---- Peso corporal ----

export interface BodyWeight {
  id: string
  userId: string
  /** Fecha local AAAA-MM-DD */
  date: string
  weightKg: number
  createdAt: string
  updatedAt: string
}

// ---- Rutinas ----

export interface WorkoutTemplate {
  id: string
  userId: string
  name: string
  description: string | null
  weekdays: Weekday[]
  notes: string | null
  position: number
  source: 'generated' | 'manual'
  createdAt: string
  updatedAt: string
}

export interface TemplateExercise {
  id: string
  userId: string
  templateId: string
  exerciseId: string
  position: number
  targetSets: number
  targetRepsMin: number
  targetRepsMax: number
  targetRestSeconds: number
  targetRir: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}
