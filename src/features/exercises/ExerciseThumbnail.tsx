import { Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Exercise, MuscleGroup } from '@/types/models'

/** Tinte suave por grupo muscular (fondo + ícono). */
const TINT: Record<MuscleGroup, string> = {
  chest: '139 92 246',
  back: '56 189 248',
  shoulders: '244 114 182',
  biceps: '251 146 60',
  triceps: '250 204 21',
  forearms: '163 230 53',
  quads: '52 211 153',
  hamstrings: '45 212 191',
  glutes: '232 121 249',
  calves: '96 165 250',
  abs: '248 113 113',
  full_body: '167 139 250',
  other: '146 146 158',
}

/** Miniatura del ejercicio: la imagen si existe; si no, una pesa con el tinte del grupo muscular. */
export function ExerciseThumbnail({
  exercise,
  className,
}: {
  exercise: Pick<Exercise, 'primaryMuscle' | 'name'> & { imageUrl?: string | null }
  className?: string
}) {
  const rgb = TINT[exercise.primaryMuscle ?? 'other']
  if (exercise.imageUrl) {
    return (
      <img
        src={exercise.imageUrl}
        alt=""
        className={cn('size-12 shrink-0 rounded-xl object-cover', className)}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn('grid size-12 shrink-0 place-items-center rounded-xl', className)}
      style={{ backgroundColor: `rgb(${rgb} / 0.12)`, color: `rgb(${rgb})` }}
    >
      <Dumbbell className="size-5" strokeWidth={1.9} />
    </span>
  )
}
