import type { TrainingPlace } from '@/types/models'

/**
 * Rutinas extra listas para agregar (no entran en la rotación: se hacen cuando querés).
 * Los nombres están en inglés como en la base; se traducen al mostrar (i18n/names.ts).
 */
export interface LibraryExercise {
  name: string
  sets: number
  min: number
  max: number
  rir: number
}

export interface LibraryRoutine {
  id: string
  name: string
  description: string
  minutes: number
  place: TrainingPlace | 'any'
  exercises: LibraryExercise[]
}

const ex = (name: string, sets: number, min: number, max: number, rir = 2): LibraryExercise => ({
  name,
  sets,
  min,
  max,
  rir,
})

export const ROUTINE_LIBRARY: LibraryRoutine[] = [
  {
    id: 'arms',
    name: 'Arms Blast',
    description: 'Biceps & triceps pump',
    minutes: 40,
    place: 'gym',
    exercises: [
      ex('EZ-Bar Curl', 3, 8, 12),
      ex('Rope Triceps Pushdown', 3, 10, 15),
      ex('Incline Dumbbell Curl', 3, 10, 12),
      ex('Overhead Cable Triceps Extension', 3, 10, 12),
      ex('Hammer Curl', 2, 12, 15, 1),
      ex('Triceps Kickback', 2, 12, 15, 1),
    ],
  },
  {
    id: 'glutes',
    name: 'Glutes & Hamstrings',
    description: 'Hip thrusts, hinges & curls',
    minutes: 50,
    place: 'gym',
    exercises: [
      ex('Barbell Hip Thrust', 4, 8, 12),
      ex('Romanian Deadlift', 3, 8, 10),
      ex('Bulgarian Split Squat', 3, 10, 12),
      ex('Lying Leg Curl', 3, 10, 15),
      ex('Hip Abduction Machine', 3, 12, 20, 1),
    ],
  },
  {
    id: 'shoulders',
    name: 'Shoulders 3D',
    description: 'Front, side & rear delts',
    minutes: 40,
    place: 'gym',
    exercises: [
      ex('Dumbbell Shoulder Press', 3, 8, 12),
      ex('Dumbbell Lateral Raise', 4, 12, 15, 1),
      ex('Cable Lateral Raise', 3, 12, 15, 1),
      ex('Reverse Pec Deck', 3, 12, 15),
      ex('Face Pull', 3, 12, 15),
    ],
  },
  {
    id: 'chest',
    name: 'Chest Pump',
    description: 'Presses, flyes & push-ups',
    minutes: 45,
    place: 'gym',
    exercises: [
      ex('Incline Dumbbell Press', 4, 8, 12),
      ex('Machine Chest Press', 3, 10, 12),
      ex('Low Cable Crossover', 3, 12, 15),
      ex('Pec Deck Fly', 3, 12, 15, 1),
      ex('Push-Up', 2, 10, 20, 1),
    ],
  },
  {
    id: 'core',
    name: 'Core Express',
    description: '15 minutes of abs',
    minutes: 15,
    place: 'any',
    exercises: [
      ex('Plank', 3, 30, 60),
      ex('Lying Leg Raise', 3, 10, 15),
      ex('Russian Twist', 3, 16, 24),
      ex('Crunch', 3, 15, 20, 1),
    ],
  },
  {
    id: 'calves-abs',
    name: 'Calves & Abs',
    description: 'The finisher nobody wants to do',
    minutes: 25,
    place: 'gym',
    exercises: [
      ex('Standing Calf Raise', 4, 10, 15),
      ex('Seated Calf Raise', 3, 12, 20),
      ex('Hanging Leg Raise', 3, 8, 15),
      ex('Cable Crunch', 3, 12, 15),
    ],
  },
  {
    id: 'express',
    name: 'Full Body Express',
    description: '30 minutes, whole body',
    minutes: 30,
    place: 'any',
    exercises: [
      ex('Goblet Squat', 3, 10, 12),
      ex('Dumbbell Bench Press', 3, 8, 12),
      ex('One-Arm Dumbbell Row', 3, 10, 12),
      ex('Dumbbell Shoulder Press', 2, 10, 12),
      ex('Plank', 2, 30, 45),
    ],
  },
  {
    id: 'home',
    name: 'Home, No Equipment',
    description: 'Bodyweight only',
    minutes: 30,
    place: 'home',
    exercises: [
      ex('Push-Up', 4, 8, 20),
      ex('Glute Bridge', 3, 15, 20),
      ex('Bulgarian Split Squat', 3, 10, 12),
      ex('Plank', 3, 30, 60),
      ex('Lying Leg Raise', 3, 10, 15),
    ],
  },
]
