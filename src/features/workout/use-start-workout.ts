import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { workoutService } from '@/services/workout'
import { t } from '@/i18n'

/** Empieza un entrenamiento (de una rutina o libre). Si ya hay uno en curso, lleva a ese. */
export function useStartWorkout() {
  const navigate = useNavigate()
  return async (templateId: string | null) => {
    const active = await workoutService.active()
    if (active && active.templateId !== templateId) {
      toast(t.workouts.activeOther)
      navigate(`/workout/${active.id}`)
      return
    }
    const id = templateId
      ? await workoutService.startFromTemplate(templateId)
      : await workoutService.startEmpty('Workout')
    navigate(`/workout/${id}`)
  }
}
