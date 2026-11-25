import type { Equipment, Exercise, Experience, Goal, TrainingPlace, Weekday } from '@/types/models'

/**
 * Generador de rutinas a partir del cuestionario. Reglas simples y explicables, sin IA:
 *
 * - Split según la cantidad de días: 2 → Full Body A/B · 3 → Full Body A/B/C ·
 *   4 → Upper/Lower A/B · 5 → Upper/Lower/Push/Pull/Legs · 6 → Push/Pull/Legs A/B.
 * - Cada día tiene "slots" ordenados por prioridad (primero los básicos). Cada slot tiene
 *   candidatos: se usa el primero disponible con el equipamiento del lugar y no repetido en el día.
 * - La duración de la sesión define cuántos ejercicios entran.
 * - Series, repeticiones, descanso y RIR según objetivo y experiencia.
 *
 * Es un punto de partida: el usuario puede editar todo después.
 */

type Role = 'main' | 'accessory'

interface Slot {
  role: Role
  /** Nombres de ejercicios de la biblioteca, en orden de preferencia */
  candidates: string[]
}

interface DayPlan {
  name: string
  description: string
  slots: Slot[]
}

const main = (...candidates: string[]): Slot => ({ role: 'main', candidates })
const acc = (...candidates: string[]): Slot => ({ role: 'accessory', candidates })

const DAYS = {
  fullA: {
    name: 'Full Body A',
    description: 'Cuerpo completo: sentadilla, press y remo',
    slots: [
      main('Sentadilla con barra', 'Sentadilla goblet'),
      main('Press banca plano con barra', 'Press plano con mancuernas'),
      main('Remo con barra', 'Remo con mancuerna a una mano'),
      acc('Peso muerto rumano', 'Peso muerto rumano con mancuernas'),
      acc('Elevaciones laterales con mancuernas'),
      acc('Curl con barra Z', 'Curl con mancuernas alterno'),
      acc(
        'Extensión de tríceps en polea con cuerda',
        'Extensión de tríceps sobre la cabeza con mancuerna',
      ),
      acc('Plancha'),
    ],
  },
  fullB: {
    name: 'Full Body B',
    description: 'Cuerpo completo: bisagra, hombros y tirón vertical',
    slots: [
      main('Peso muerto rumano', 'Peso muerto rumano con mancuernas'),
      main('Press militar con barra', 'Press de hombros con mancuernas'),
      main('Jalón al pecho', 'Dominadas'),
      main('Prensa de piernas', 'Sentadilla búlgara'),
      acc('Press inclinado con mancuernas'),
      acc('Curl femoral acostado', 'Puente de glúteos'),
      acc('Curl martillo'),
      acc('Crunch en polea', 'Crunch abdominal'),
    ],
  },
  fullC: {
    name: 'Full Body C',
    description: 'Cuerpo completo: variantes y trabajo de glúteos',
    slots: [
      main('Sentadilla hack', 'Zancadas con mancuernas'),
      main('Press inclinado con mancuernas'),
      main('Remo en polea baja (gironda)', 'Remo con mancuerna a una mano'),
      acc('Hip thrust con barra', 'Puente de glúteos'),
      acc('Face pull', 'Pájaros (vuelos posteriores)'),
      acc('Elevaciones laterales en polea', 'Elevaciones laterales con mancuernas'),
      acc('Extensión de tríceps en polea con barra', 'Patada de tríceps'),
      acc('Elevación de talones de pie'),
    ],
  },
  upperA: {
    name: 'Upper A',
    description: 'Pecho, espalda, hombros y brazos',
    slots: [
      main('Press banca plano con barra', 'Press plano con mancuernas'),
      main('Remo con barra', 'Remo con mancuerna a una mano'),
      main('Press de hombros con mancuernas'),
      main('Jalón al pecho', 'Dominadas'),
      acc('Elevaciones laterales con mancuernas'),
      acc('Curl con barra Z', 'Curl con mancuernas alterno'),
      acc(
        'Extensión de tríceps en polea con cuerda',
        'Extensión de tríceps sobre la cabeza con mancuerna',
      ),
    ],
  },
  lowerA: {
    name: 'Lower A',
    description: 'Cuádriceps, isquiotibiales, gemelos y abdominales',
    slots: [
      main('Sentadilla con barra', 'Sentadilla goblet'),
      main('Peso muerto rumano', 'Peso muerto rumano con mancuernas'),
      main('Prensa de piernas', 'Zancadas con mancuernas'),
      acc('Curl femoral acostado', 'Puente de glúteos'),
      acc('Elevación de talones de pie'),
      acc('Crunch en polea', 'Crunch abdominal'),
      acc('Extensión de cuádriceps', 'Step-up al cajón'),
    ],
  },
  upperB: {
    name: 'Upper B',
    description: 'Variantes de empuje y tirón, hombro posterior',
    slots: [
      main('Press inclinado con mancuernas'),
      main('Jalón con agarre estrecho', 'Dominadas supinas (chin-ups)'),
      main('Press militar con barra', 'Press Arnold'),
      main('Remo en polea baja (gironda)', 'Remo con mancuerna a una mano'),
      acc('Elevaciones laterales en polea', 'Elevaciones laterales con mancuernas'),
      acc('Curl martillo'),
      acc('Extensión de tríceps sobre la cabeza en polea', 'Patada de tríceps'),
      acc('Face pull', 'Pájaros (vuelos posteriores)'),
    ],
  },
  lowerB: {
    name: 'Lower B',
    description: 'Bisagra de cadera, unilateral y glúteos',
    slots: [
      main('Peso muerto convencional', 'Peso muerto rumano con mancuernas'),
      main('Sentadilla búlgara'),
      acc('Hip thrust con barra', 'Puente de glúteos'),
      acc('Curl femoral sentado', 'Step-up al cajón'),
      acc('Extensión de cuádriceps', 'Zancadas con mancuernas'),
      acc('Elevación de talones sentado'),
      acc('Elevación de piernas colgado', 'Elevación de piernas en banco'),
    ],
  },
  pushA: {
    name: 'Push A',
    description: 'Pecho, hombros y tríceps',
    slots: [
      main('Press banca plano con barra', 'Press plano con mancuernas'),
      main('Press militar con barra', 'Press de hombros con mancuernas'),
      main('Press inclinado con mancuernas'),
      acc('Elevaciones laterales con mancuernas'),
      acc(
        'Extensión de tríceps en polea con cuerda',
        'Extensión de tríceps sobre la cabeza con mancuerna',
      ),
      acc('Cruces en polea alta', 'Aperturas con mancuernas'),
      acc('Fondos en paralelas (tríceps)', 'Flexiones de brazos'),
    ],
  },
  pullA: {
    name: 'Pull A',
    description: 'Espalda, hombro posterior y bíceps',
    slots: [
      main('Jalón al pecho', 'Dominadas'),
      main('Remo con barra', 'Remo con mancuerna a una mano'),
      main('Remo en máquina'),
      acc('Face pull', 'Pájaros (vuelos posteriores)'),
      acc('Curl con barra', 'Curl con mancuernas alterno'),
      acc('Curl martillo'),
      acc('Encogimientos con mancuernas'),
    ],
  },
  legsA: {
    name: 'Legs A',
    description: 'Piernas completas y abdominales',
    slots: [
      main('Sentadilla con barra', 'Sentadilla goblet'),
      main('Peso muerto rumano', 'Peso muerto rumano con mancuernas'),
      main('Prensa de piernas', 'Sentadilla búlgara'),
      acc('Curl femoral acostado', 'Puente de glúteos'),
      acc('Extensión de cuádriceps', 'Zancadas con mancuernas'),
      acc('Elevación de talones de pie'),
      acc('Crunch en polea', 'Crunch abdominal'),
    ],
  },
  pushB: {
    name: 'Push B',
    description: 'Variantes de pecho y hombros',
    slots: [
      main('Press banca inclinado con barra', 'Press inclinado con mancuernas'),
      main('Press de hombros en máquina', 'Press Arnold'),
      main('Press de pecho en máquina', 'Flexiones de brazos'),
      acc('Elevaciones laterales en polea', 'Elevaciones laterales con mancuernas'),
      acc('Press francés', 'Extensión de tríceps sobre la cabeza con mancuerna'),
      acc('Pec deck (contractora)', 'Aperturas con mancuernas'),
    ],
  },
  pullB: {
    name: 'Pull B',
    description: 'Variantes de espalda y bíceps',
    slots: [
      main('Jalón con agarre estrecho', 'Dominadas supinas (chin-ups)'),
      main('Remo en barra T', 'Remo con mancuerna a una mano'),
      acc('Pullover en polea alta'),
      acc('Reverse pec deck', 'Pájaros (vuelos posteriores)'),
      acc('Curl inclinado con mancuernas'),
      acc('Curl en polea', 'Curl concentrado'),
    ],
  },
  legsB: {
    name: 'Legs B',
    description: 'Glúteos, unilateral y gemelos',
    slots: [
      main('Sentadilla hack', 'Sentadilla búlgara'),
      main('Hip thrust con barra', 'Puente de glúteos'),
      acc('Curl femoral sentado', 'Peso muerto rumano con mancuernas'),
      acc('Extensión de cuádriceps', 'Step-up al cajón'),
      acc('Elevación de talones sentado'),
      acc('Elevación de piernas colgado', 'Elevación de piernas en banco'),
    ],
  },
} satisfies Record<string, DayPlan>

const SPLITS: Record<number, DayPlan[]> = {
  1: [DAYS.fullA],
  2: [DAYS.fullA, DAYS.fullB],
  3: [DAYS.fullA, DAYS.fullB, DAYS.fullC],
  4: [DAYS.upperA, DAYS.lowerA, DAYS.upperB, DAYS.lowerB],
  5: [DAYS.upperA, DAYS.lowerA, DAYS.pushA, DAYS.pullA, DAYS.legsB],
  6: [DAYS.pushA, DAYS.pullA, DAYS.legsA, DAYS.pushB, DAYS.pullB, DAYS.legsB],
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

export interface GeneratorInput {
  trainingDays: Weekday[]
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
  weekdays: Weekday[]
  exercises: GeneratedExercise[]
}

/** Ordena los días de lunes a domingo. */
export function sortWeekdays(days: Weekday[]): Weekday[] {
  return [...new Set(days)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
}

export function generateRoutines(
  input: GeneratorInput,
  library: readonly Exercise[],
): GeneratedTemplate[] {
  const days = sortWeekdays(input.trainingDays)
  const count = Math.min(6, Math.max(1, days.length))
  const plan = SPLITS[count] ?? SPLITS[3]!
  const allowed = PLACE_EQUIPMENT[input.place]
  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e]))
  const max = exercisesPerSession(input.sessionMinutes)

  // Con 7 días elegidos se usan 6 (al menos un día de descanso); el split rota sobre los días.
  const usedDays = days.slice(0, count)

  return plan.map((day, i) => {
    const used = new Set<string>()
    const exercises: GeneratedExercise[] = []
    for (const slot of day.slots) {
      if (exercises.length >= max) break
      const exercise = slot.candidates
        .map((name) => byName.get(name.toLowerCase()))
        .find((e) => e && !used.has(e.id) && (!e.equipment || allowed.has(e.equipment)))
      if (!exercise) continue
      used.add(exercise.id)
      exercises.push({
        exerciseId: exercise.id,
        ...prescription(slot.role, input.goal, input.experience, exercise.exerciseType),
      })
    }
    return {
      name: day.name,
      description: day.description,
      weekdays: usedDays[i] !== undefined ? [usedDays[i]!] : [],
      exercises,
    }
  })
}

/** Nombres de todos los ejercicios que usa el generador (para validar contra la biblioteca). */
export function allGeneratorExerciseNames(): string[] {
  return [...new Set(Object.values(DAYS).flatMap((d) => d.slots.flatMap((s) => s.candidates)))]
}
