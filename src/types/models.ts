import type { CardioActivity, Intensity } from '@/domain/cardio'
import type { AvatarConfig } from '@/domain/avatar'

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
  /** Nombre visible (en inglés para la biblioteca global) */
  name: string
  /** Nombre en español (solo para buscar) */
  nameEs?: string | null
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
/** full_body · upper_lower · ppl (Push / Pull + Core / Legs) · classic (Chest & Triceps / Back & Biceps / Legs & Shoulders) */
export type SplitStyle = 'full_body' | 'upper_lower' | 'ppl' | 'classic'
/** 0 = domingo … 6 = sábado (igual que Date.getDay()) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type Injury = 'shoulder' | 'knee' | 'lower_back' | 'wrist_elbow'
export type EquipmentPref = 'free' | 'machines' | 'mixed'

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
  /** Días de entrenamiento por semana (2–6). Las rutinas rotan: no hay días fijos. */
  daysPerWeek: number
  split: SplitStyle
  /** Hace tiempo que no entrena piernas: arrancar con menos volumen y más margen. */
  easeLegs: boolean
  sessionMinutes: number
  place: TrainingPlace
  /** Lesiones o molestias: el generador evita los ejercicios de riesgo (opcional). */
  injuries?: Injury[]
  /** Preferencia de equipamiento (opcional). */
  equipmentPref?: EquipmentPref
  /** El personaje (opcional: los perfiles viejos no lo tienen y usan uno por defecto). */
  avatar?: AvatarConfig
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
  /** Días asignados (opcional). Vacío = entra en la rotación. */
  weekdays: Weekday[]
  notes: string | null
  position: number
  source: 'generated' | 'manual'
  createdAt: string
  updatedAt: string
  /** false = rutina extra (biblioteca): no entra en la rotación. */
  inRotation?: boolean
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
  /** Kilos objetivo por serie (índice = serie). Se precargan al entrenar y se actualizan al terminar. */
  targetWeights?: (number | null)[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

// ---- Entrenamientos ----

export type SessionStatus = 'in_progress' | 'completed' | 'discarded'
export type SetType = 'warmup' | 'normal'

export interface WorkoutSession {
  id: string
  userId: string
  templateId: string | null
  name: string
  startedAt: string
  completedAt: string | null
  durationSeconds: number | null
  status: SessionStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionExercise {
  id: string
  userId: string
  sessionId: string
  exerciseId: string | null
  exerciseNameSnapshot: string
  position: number
  targetSets: number | null
  targetRepsMin: number | null
  targetRepsMax: number | null
  targetRestSeconds: number | null
  targetRir: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ExerciseSet {
  id: string
  userId: string
  sessionId: string
  sessionExerciseId: string
  setNumber: number
  setType: SetType
  weightKg: number | null
  repetitions: number | null
  durationSeconds: number | null
  rir: number | null
  isCompleted: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

// ---- Cardio y agua ----

export interface CardioLog {
  id: string
  userId: string
  /** Fecha local AAAA-MM-DD */
  date: string
  activity: CardioActivity
  intensity: Intensity
  minutes: number
  /** Calorías estimadas al guardar (con el peso de ese momento) */
  kcal: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface WaterLog {
  id: string
  userId: string
  date: string
  ml: number
  createdAt: string
  updatedAt: string
}
