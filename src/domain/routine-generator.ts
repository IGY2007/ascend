import type {
  Equipment,
  Exercise,
  Experience,
  Goal,
  MuscleGroup,
  SplitStyle,
  TrainingPlace,
  Weekday,
} from '@/types/models'

/**
 * Generador de rutinas a partir del cuestionario. Reglas simples y explicables, sin IA.
 *
 * - Las rutinas forman un CICLO que rota: no hay días fijos. Los días por semana solo
 *   definen cuántas veces pasás por el ciclo y qué variante conviene.
 * - Cada día tiene "slots" en orden de prioridad (primero los básicos) y "finishers" (core,
 *   gemelos) que siempre entran. Cada slot tiene candidatos: se usa el primero disponible con el
 *   equipamiento del lugar y que no se repita en el día.
 * - La duración de la sesión define cuántos ejercicios principales entran.
 * - Series, repeticiones, descanso y RIR según objetivo y experiencia.
 * - "Piernas de a poco": menos series, más repeticiones y más margen (RIR) en piernas.
 */

type Role = 'main' | 'accessory'

interface Slot {
  role: Role
  /** Nombres (en inglés) de ejercicios de la biblioteca, en orden de preferencia */
  candidates: string[]
}

interface DayPlan {
  name: string
  description: string
  slots: Slot[]
  finishers?: Slot[]
}

const main = (...candidates: string[]): Slot => ({ role: 'main', candidates })
const acc = (...candidates: string[]): Slot => ({ role: 'accessory', candidates })

const CORE = [acc('Hanging Leg Raise', 'Lying Leg Raise'), acc('Cable Crunch', 'Crunch')]
const CALVES = [acc('Standing Calf Raise', 'Leg Press Calf Raise')]

const DAYS = {
  // ---------- Full body
  fullA: {
    name: 'Full Body A',
    description: 'Squat, press & row',
    slots: [
      main('Barbell Back Squat', 'Goblet Squat'),
      main('Barbell Bench Press', 'Dumbbell Bench Press'),
      main('Barbell Row', 'One-Arm Dumbbell Row'),
      acc('Romanian Deadlift', 'Dumbbell Romanian Deadlift'),
      acc('Dumbbell Lateral Raise'),
      acc('EZ-Bar Curl', 'Alternating Dumbbell Curl'),
      acc('Rope Triceps Pushdown', 'Overhead Dumbbell Triceps Extension'),
    ],
    finishers: [acc('Plank')],
  },
  fullB: {
    name: 'Full Body B',
    description: 'Hinge, overhead press & pulldown',
    slots: [
      main('Romanian Deadlift', 'Dumbbell Romanian Deadlift'),
      main('Barbell Overhead Press', 'Dumbbell Shoulder Press'),
      main('Lat Pulldown', 'Pull-Up'),
      main('Leg Press', 'Bulgarian Split Squat'),
      acc('Incline Dumbbell Press'),
      acc('Lying Leg Curl', 'Glute Bridge'),
      acc('Hammer Curl'),
    ],
    finishers: [acc('Cable Crunch', 'Crunch')],
  },
  fullC: {
    name: 'Full Body C',
    description: 'Variations & glutes',
    slots: [
      main('Hack Squat', 'Dumbbell Lunge'),
      main('Incline Dumbbell Press'),
      main('Seated Cable Row', 'One-Arm Dumbbell Row'),
      acc('Barbell Hip Thrust', 'Glute Bridge'),
      acc('Face Pull', 'Reverse Dumbbell Fly'),
      acc('Cable Lateral Raise', 'Dumbbell Lateral Raise'),
      acc('Bar Triceps Pushdown', 'Triceps Kickback'),
    ],
    finishers: CALVES,
  },
  // ---------- Upper / Lower
  upperA: {
    name: 'Upper A',
    description: 'Chest, back, shoulders & arms',
    slots: [
      main('Barbell Bench Press', 'Dumbbell Bench Press'),
      main('Barbell Row', 'One-Arm Dumbbell Row'),
      main('Dumbbell Shoulder Press'),
      main('Lat Pulldown', 'Pull-Up'),
      acc('Dumbbell Lateral Raise'),
      acc('EZ-Bar Curl', 'Alternating Dumbbell Curl'),
      acc('Rope Triceps Pushdown', 'Overhead Dumbbell Triceps Extension'),
    ],
  },
  lowerA: {
    name: 'Lower A',
    description: 'Quads, hamstrings, calves & core',
    slots: [
      main('Barbell Back Squat', 'Goblet Squat'),
      main('Romanian Deadlift', 'Dumbbell Romanian Deadlift'),
      main('Leg Press', 'Dumbbell Lunge'),
      acc('Lying Leg Curl', 'Glute Bridge'),
      acc('Leg Extension', 'Box Step-Up'),
    ],
    finishers: [...CALVES, acc('Cable Crunch', 'Crunch')],
  },
  upperB: {
    name: 'Upper B',
    description: 'Push & pull variations, rear delts',
    slots: [
      main('Incline Dumbbell Press'),
      main('Close-Grip Lat Pulldown', 'Chin-Up'),
      main('Barbell Overhead Press', 'Arnold Press'),
      main('Seated Cable Row', 'One-Arm Dumbbell Row'),
      acc('Cable Lateral Raise', 'Dumbbell Lateral Raise'),
      acc('Hammer Curl'),
      acc('Overhead Cable Triceps Extension', 'Triceps Kickback'),
      acc('Face Pull', 'Reverse Dumbbell Fly'),
    ],
  },
  lowerB: {
    name: 'Lower B',
    description: 'Hip hinge, single-leg & glutes',
    slots: [
      main('Conventional Deadlift', 'Dumbbell Romanian Deadlift'),
      main('Bulgarian Split Squat'),
      acc('Barbell Hip Thrust', 'Glute Bridge'),
      acc('Seated Leg Curl', 'Box Step-Up'),
      acc('Leg Extension', 'Dumbbell Lunge'),
    ],
    finishers: [
      acc('Seated Calf Raise', 'Standing Calf Raise'),
      acc('Hanging Leg Raise', 'Lying Leg Raise'),
    ],
  },
  // ---------- Push / Pull + Core / Legs
  push: {
    name: 'Chest, Shoulders & Triceps',
    description: 'Push day',
    slots: [
      main('Barbell Bench Press', 'Dumbbell Bench Press'),
      main('Barbell Overhead Press', 'Dumbbell Shoulder Press'),
      main('Incline Dumbbell Press'),
      acc('Dumbbell Lateral Raise'),
      acc('Rope Triceps Pushdown', 'Overhead Dumbbell Triceps Extension'),
      acc('High Cable Crossover', 'Dumbbell Fly'),
      acc('Overhead Cable Triceps Extension', 'Triceps Kickback'),
    ],
  },
  pull: {
    name: 'Back, Biceps & Core',
    description: 'Pull day + abs',
    slots: [
      main('Lat Pulldown', 'Pull-Up'),
      main('Barbell Row', 'One-Arm Dumbbell Row'),
      acc('Seated Cable Row', 'Machine Row'),
      acc('EZ-Bar Curl', 'Alternating Dumbbell Curl'),
      acc('Face Pull', 'Reverse Dumbbell Fly'),
      acc('Hammer Curl'),
    ],
    finishers: CORE,
  },
  legs: {
    name: 'Legs & Calves',
    description: 'Quads, hamstrings, glutes & calves',
    slots: [
      main('Barbell Back Squat', 'Goblet Squat'),
      main('Romanian Deadlift', 'Dumbbell Romanian Deadlift'),
      main('Leg Press', 'Bulgarian Split Squat'),
      acc('Lying Leg Curl', 'Glute Bridge'),
      acc('Leg Extension', 'Dumbbell Lunge'),
    ],
    finishers: [acc('Standing Calf Raise', 'Leg Press Calf Raise'), acc('Seated Calf Raise')],
  },
  pushB: {
    name: 'Chest, Shoulders & Triceps B',
    description: 'Push variations',
    slots: [
      main('Incline Barbell Bench Press', 'Incline Dumbbell Press'),
      main('Machine Shoulder Press', 'Arnold Press'),
      main('Machine Chest Press', 'Push-Up'),
      acc('Cable Lateral Raise', 'Dumbbell Lateral Raise'),
      acc('Skull Crusher', 'Overhead Dumbbell Triceps Extension'),
      acc('Pec Deck Fly', 'Dumbbell Fly'),
    ],
  },
  pullB: {
    name: 'Back, Biceps & Core B',
    description: 'Pull variations + abs',
    slots: [
      main('Close-Grip Lat Pulldown', 'Chin-Up'),
      main('T-Bar Row', 'One-Arm Dumbbell Row'),
      acc('Cable Pullover'),
      acc('Reverse Pec Deck', 'Reverse Dumbbell Fly'),
      acc('Incline Dumbbell Curl'),
      acc('Cable Curl', 'Concentration Curl'),
    ],
    finishers: [acc('Ab Wheel Rollout'), acc('Russian Twist')],
  },
  legsB: {
    name: 'Legs & Calves B',
    description: 'Glutes, single-leg & calves',
    slots: [
      main('Hack Squat', 'Bulgarian Split Squat'),
      main('Barbell Hip Thrust', 'Glute Bridge'),
      acc('Seated Leg Curl', 'Dumbbell Romanian Deadlift'),
      acc('Leg Extension', 'Box Step-Up'),
      acc('Dumbbell Lunge'),
    ],
    finishers: [acc('Seated Calf Raise', 'Standing Calf Raise')],
  },
  // ---------- Clásico: Chest & Triceps / Back & Biceps / Legs & Shoulders
  chestTri: {
    name: 'Chest & Triceps',
    description: 'Chest & triceps',
    slots: [
      main('Barbell Bench Press', 'Dumbbell Bench Press'),
      main('Incline Dumbbell Press'),
      acc('High Cable Crossover', 'Dumbbell Fly'),
      acc('Rope Triceps Pushdown', 'Triceps Kickback'),
      acc('Skull Crusher', 'Overhead Dumbbell Triceps Extension'),
      acc('Pec Deck Fly', 'Push-Up'),
      acc('Overhead Cable Triceps Extension', 'Triceps Dips'),
    ],
  },
  backBi: {
    name: 'Back & Biceps',
    description: 'Back, biceps & core',
    slots: [
      main('Lat Pulldown', 'Pull-Up'),
      main('Barbell Row', 'One-Arm Dumbbell Row'),
      acc('Seated Cable Row', 'Machine Row'),
      acc('EZ-Bar Curl', 'Alternating Dumbbell Curl'),
      acc('Hammer Curl'),
      acc('Face Pull', 'Reverse Dumbbell Fly'),
      acc('Incline Dumbbell Curl'),
    ],
    finishers: CORE,
  },
  legsShoulders: {
    name: 'Legs & Shoulders',
    description: 'Legs, calves & shoulders',
    slots: [
      main('Barbell Back Squat', 'Goblet Squat'),
      main('Barbell Overhead Press', 'Dumbbell Shoulder Press'),
      main('Romanian Deadlift', 'Dumbbell Romanian Deadlift'),
      acc('Leg Press', 'Bulgarian Split Squat'),
      acc('Dumbbell Lateral Raise'),
      acc('Lying Leg Curl', 'Glute Bridge'),
      acc('Reverse Pec Deck', 'Reverse Dumbbell Fly'),
    ],
    finishers: CALVES,
  },
  shouldersCore: {
    name: 'Shoulders & Core',
    description: 'Shoulders, traps & abs',
    slots: [
      main('Barbell Overhead Press', 'Dumbbell Shoulder Press'),
      acc('Dumbbell Lateral Raise'),
      acc('Reverse Pec Deck', 'Reverse Dumbbell Fly'),
      acc('Cable Lateral Raise', 'Front Raise'),
      acc('Face Pull', 'Dumbbell Shrug'),
      acc('Dumbbell Shrug'),
    ],
    finishers: CORE,
  },
  armsAbs: {
    name: 'Arms & Abs',
    description: 'Biceps, triceps & abs',
    slots: [
      main('Close-Grip Bench Press', 'Triceps Dips'),
      acc('EZ-Bar Curl', 'Alternating Dumbbell Curl'),
      acc('Skull Crusher', 'Overhead Dumbbell Triceps Extension'),
      acc('Hammer Curl'),
      acc('Rope Triceps Pushdown', 'Triceps Kickback'),
      acc('Preacher Curl', 'Concentration Curl'),
    ],
    finishers: [acc('Ab Wheel Rollout', 'Crunch'), acc('Russian Twist')],
  },
} satisfies Record<string, DayPlan>

/** Ciclo de rutinas según el estilo y los días por semana. */
export function splitCycle(style: SplitStyle, daysPerWeek: number): DayPlan[] {
  switch (style) {
    case 'full_body':
      return daysPerWeek <= 2 ? [DAYS.fullA, DAYS.fullB] : [DAYS.fullA, DAYS.fullB, DAYS.fullC]
    case 'upper_lower':
      return [DAYS.upperA, DAYS.lowerA, DAYS.upperB, DAYS.lowerB]
    case 'ppl':
      return daysPerWeek >= 5
        ? [DAYS.push, DAYS.pull, DAYS.legs, DAYS.pushB, DAYS.pullB, DAYS.legsB]
        : [DAYS.push, DAYS.pull, DAYS.legs]
    case 'classic':
      if (daysPerWeek <= 3) return [DAYS.chestTri, DAYS.backBi, DAYS.legsShoulders]
      if (daysPerWeek === 4) return [DAYS.chestTri, DAYS.backBi, DAYS.legs, DAYS.shouldersCore]
      return [DAYS.chestTri, DAYS.backBi, DAYS.legs, DAYS.shouldersCore, DAYS.armsAbs]
  }
}

/** Split recomendado según experiencia y días disponibles. */
export function recommendedSplit(experience: Experience, daysPerWeek: number): SplitStyle {
  if (experience === 'beginner') return daysPerWeek <= 3 ? 'full_body' : 'upper_lower'
  if (daysPerWeek <= 2) return 'full_body'
  if (daysPerWeek === 4) return 'upper_lower'
  return 'ppl'
}

const PLACE_EQUIPMENT: Record<TrainingPlace, ReadonlySet<Equipment>> = {
  gym: new Set<Equipment>([
    'barbell',
    'dumbbell',
    'machine',
    'cable',
    'bodyweight',
    'smith',
    'other',
  ]),
  home: new Set<Equipment>(['dumbbell', 'bodyweight', 'kettlebell', 'band', 'other']),
}

const LEG_MUSCLES = new Set<MuscleGroup>(['quads', 'hamstrings', 'glutes', 'calves'])

export function exercisesPerSession(minutes: number): number {
  if (minutes <= 45) return 4
  if (minutes <= 60) return 5
  if (minutes <= 75) return 6
  return 7
}

export interface Prescription {
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  rir: number
}

export function prescription(
  role: Role,
  goal: Goal,
  experience: Experience,
  exerciseType: Exercise['exerciseType'],
): Prescription {
  const rir = experience === 'beginner' ? 3 : role === 'main' ? 2 : 1
  if (exerciseType === 'timed') return { sets: 3, repsMin: 30, repsMax: 60, restSeconds: 60, rir }
  if (role === 'main') {
    if (goal === 'strength') return { sets: 4, repsMin: 3, repsMax: 6, restSeconds: 180, rir }
    if (experience === 'beginner')
      return { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 120, rir }
    return { sets: 3, repsMin: 6, repsMax: 10, restSeconds: 150, rir }
  }
  if (goal === 'strength') return { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90, rir }
  return { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 75, rir }
}

/** Piernas de a poco: menos series, más repeticiones y más margen. */
export function easeIn(p: Prescription): Prescription {
  return {
    ...p,
    sets: Math.max(2, p.sets - 1),
    repsMin: Math.max(p.repsMin, 10),
    repsMax: Math.max(p.repsMax, 15),
    rir: Math.max(p.rir, 3),
  }
}

export interface GeneratorInput {
  daysPerWeek: number
  split: SplitStyle
  easeLegs: boolean
  sessionMinutes: number
  place: TrainingPlace
  goal: Goal
  experience: Experience
}

export interface GeneratedExercise extends Prescription {
  exerciseId: string
}

export interface GeneratedTemplate {
  name: string
  description: string
  notes: string | null
  weekdays: Weekday[]
  exercises: GeneratedExercise[]
}

export const EASE_LEGS_NOTE =
  'Legs: start light and leave reps in reserve. Once every set feels easy, add weight gradually.'

export function generateRoutines(
  input: GeneratorInput,
  library: readonly Exercise[],
): GeneratedTemplate[] {
  const allowed = PLACE_EQUIPMENT[input.place]
  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e]))
  const max = exercisesPerSession(input.sessionMinutes)

  const pick = (slot: Slot, used: Set<string>) =>
    slot.candidates
      .map((name) => byName.get(name.toLowerCase()))
      .find((e) => e && !used.has(e.id) && (!e.equipment || allowed.has(e.equipment)))

  return splitCycle(input.split, input.daysPerWeek).map((day) => {
    const used = new Set<string>()
    const exercises: GeneratedExercise[] = []
    let touchesLegs = false

    const add = (slot: Slot) => {
      const exercise = pick(slot, used)
      if (!exercise) return
      used.add(exercise.id)
      let rx = prescription(slot.role, input.goal, input.experience, exercise.exerciseType)
      if (exercise.primaryMuscle && LEG_MUSCLES.has(exercise.primaryMuscle)) {
        touchesLegs = true
        if (input.easeLegs && exercise.exerciseType !== 'timed') rx = easeIn(rx)
      }
      exercises.push({ exerciseId: exercise.id, ...rx })
    }

    for (const slot of day.slots) {
      if (exercises.length >= max) break
      add(slot)
    }
    for (const slot of day.finishers ?? []) add(slot)

    return {
      name: day.name,
      description: day.description,
      notes: input.easeLegs && touchesLegs ? EASE_LEGS_NOTE : null,
      weekdays: [],
      exercises,
    }
  })
}

/** Ordena los días de lunes a domingo. */
export function sortWeekdays(days: Weekday[]): Weekday[] {
  return [...new Set(days)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
}

/** Nombres de todos los ejercicios que usa el generador (para validar contra la biblioteca). */
export function allGeneratorExerciseNames(): string[] {
  const days: DayPlan[] = Object.values(DAYS)
  return [
    ...new Set(
      days.flatMap((d) => [...d.slots, ...(d.finishers ?? [])].flatMap((s) => s.candidates)),
    ),
  ]
}
