import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { PlayCircle } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Tip } from '@/components/ui/tip'
import { exerciseName } from '@/i18n/names'
import { t } from '@/i18n'
import type { Exercise } from '@/types/models'
import { exerciseImages, techniqueVideoUrl } from './exercise-media'

/** Técnica de un ejercicio: las dos posiciones alternándose, músculo, equipo y videos. */
export function TechniqueSheet({
  exercise,
  onClose,
}: {
  exercise: Exercise | null
  onClose: () => void
}) {
  const reduce = useReducedMotion()
  const [frame, setFrame] = useState(0)
  const imgs = exercise ? exerciseImages(exercise) : null

  useEffect(() => {
    if (!exercise || reduce) return
    const id = window.setInterval(() => setFrame((f) => 1 - f), 1100)
    return () => window.clearInterval(id)
  }, [exercise, reduce])

  return (
    <Sheet
      open={exercise !== null}
      onOpenChange={(o) => !o && onClose()}
      title={exercise ? exerciseName(exercise) : ''}
    >
      {exercise && (
        <div className="space-y-4 pt-1">
          {imgs &&
            (reduce ? (
              <div className="grid grid-cols-2 gap-2">
                {imgs.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="aspect-[3/2] w-full rounded-2xl object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-card-2">
                {imgs.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={i === 0 ? t.technique.start : t.technique.end}
                    className="absolute inset-0 size-full object-cover transition-opacity duration-300"
                    style={{ opacity: frame === i ? 1 : 0 }}
                  />
                ))}
                <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                  {frame === 0 ? t.technique.start : t.technique.end}
                </span>
              </div>
            ))}
          <div className="flex flex-wrap gap-1.5">
            {exercise.primaryMuscle && (
              <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-medium text-accent-2">
                {t.labels.muscle[exercise.primaryMuscle]}
              </span>
            )}
            {exercise.equipment && (
              <span className="rounded-full bg-card-2 px-3 py-1 text-sm text-muted">
                {t.labels.equipment[exercise.equipment]}
              </span>
            )}
          </div>
          <Tip>{t.technique.tip}</Tip>
          <a
            href={techniqueVideoUrl(exercise)}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-field)] border border-border bg-card font-semibold text-fg hover:border-border-strong"
          >
            <PlayCircle className="size-5 text-danger" />
            {t.technique.video}
          </a>
          {imgs && <p className="text-center text-[0.7rem] text-subtle">{t.technique.credit}</p>}
        </div>
      )}
    </Sheet>
  )
}
