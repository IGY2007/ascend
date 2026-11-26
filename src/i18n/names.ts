import { lang } from '.'
import { EASE_LEGS_NOTE } from '@/domain/routine-generator'

/**
 * Nombres de ejercicios y rutinas en el idioma activo. Se traducen al MOSTRAR: en la base quedan
 * en inglés (los ejercicios globales tienen `nameEs`; las rutinas generadas usan esta tabla).
 * Lo que escribe el usuario a mano no está en la tabla y se muestra tal cual.
 */
const ROUTINES_ES: Record<string, string> = {
  'Full Body A': 'Cuerpo completo A',
  'Full Body B': 'Cuerpo completo B',
  'Full Body C': 'Cuerpo completo C',
  'Upper A': 'Tren superior A',
  'Upper B': 'Tren superior B',
  'Lower A': 'Tren inferior A',
  'Lower B': 'Tren inferior B',
  'Chest, Shoulders & Triceps': 'Pecho, hombros y tríceps',
  'Chest, Shoulders & Triceps B': 'Pecho, hombros y tríceps B',
  'Back, Biceps & Core': 'Espalda, bíceps y core',
  'Back, Biceps & Core B': 'Espalda, bíceps y core B',
  'Legs & Calves': 'Piernas y gemelos',
  'Legs & Calves B': 'Piernas y gemelos B',
  'Chest & Triceps': 'Pecho y tríceps',
  'Back & Biceps': 'Espalda y bíceps',
  'Legs & Shoulders': 'Piernas y hombros',
  'Shoulders & Core': 'Hombros y core',
  'Arms & Abs': 'Brazos y abdominales',
  Workout: 'Entrenamiento',
  'New Workout': 'Rutina nueva',
  // Descripciones de las rutinas generadas
  'Squat, press & row': 'Sentadilla, press y remo',
  'Hinge, overhead press & pulldown': 'Bisagra de cadera, press militar y jalón',
  'Variations & glutes': 'Variantes y glúteos',
  'Chest, back, shoulders & arms': 'Pecho, espalda, hombros y brazos',
  'Quads, hamstrings, calves & core': 'Cuádriceps, isquios, gemelos y core',
  'Push & pull variations, rear delts': 'Variantes de empuje y tirón, deltoides posterior',
  'Hip hinge, single-leg & glutes': 'Bisagra de cadera, unilaterales y glúteos',
  'Push day': 'Día de empuje',
  'Pull day + abs': 'Día de tirón + abdominales',
  'Quads, hamstrings, glutes & calves': 'Cuádriceps, isquios, glúteos y gemelos',
  'Push variations': 'Variantes de empuje',
  'Pull variations + abs': 'Variantes de tirón + abdominales',
  'Glutes, single-leg & calves': 'Glúteos, unilaterales y gemelos',
  'Chest & triceps': 'Pecho y tríceps',
  'Back, biceps & core': 'Espalda, bíceps y core',
  'Legs, calves & shoulders': 'Piernas, gemelos y hombros',
  'Shoulders, traps & abs': 'Hombros, trapecios y abdominales',
  'Biceps, triceps & abs': 'Bíceps, tríceps y abdominales',
  [EASE_LEGS_NOTE]:
    'Piernas: arrancá liviano y dejá reps en reserva. Cuando todas las series salgan cómodas, subí de a poco.',
}

/** Nombre (o descripción, o nota) de una rutina en el idioma activo. */
export function routineText(text: string): string
export function routineText(text: string | null | undefined): string | null
export function routineText(text: string | null | undefined): string | null {
  if (text == null) return null
  if (lang !== 'es') return text
  const copy = text.match(/^(.*) \(copy\)$/)
  if (copy) return `${routineText(copy[1]!)} (copia)`
  return ROUTINES_ES[text] ?? text
}

/** Nombre de un ejercicio en el idioma activo (los propios del usuario, como los escribió). */
export function exerciseName(
  ex: { name: string; nameEs?: string | null } | null | undefined,
  fallback = '',
): string {
  if (!ex) return fallback
  return lang === 'es' && ex.nameEs ? ex.nameEs : ex.name
}
