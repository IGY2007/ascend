import type { Exercise } from '@/types/models'
import { lang } from '@/i18n'
import { exerciseName } from '@/i18n/names'

/**
 * Fotos de técnica de los ejercicios de la biblioteca (posición inicial y final), del dataset de
 * dominio público free-exercise-db (Unlicense). Los ejercicios propios no tienen fotos.
 */
export function exerciseImages(ex: Pick<Exercise, 'id' | 'ownerUserId'>): [string, string] | null {
  if (ex.ownerUserId) return null
  const base = `${import.meta.env.BASE_URL}exercises/${ex.id}`
  return [`${base}-0.jpg`, `${base}-1.jpg`]
}

/** Búsqueda de videos de técnica en YouTube. */
export function techniqueVideoUrl(ex: Pick<Exercise, 'name' | 'nameEs'>): string {
  const q = lang === 'es' ? `${exerciseName(ex)} técnica correcta` : `${ex.name} proper form`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}
