import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useLocalProfile } from '@/features/profile/hooks'
import { AppShellSkeleton } from '@/app/layout/AppShellSkeleton'
import { nutritionService } from '@/services/local-data'

/** Si todavía no hizo el cuestionario, lo manda ahí antes de mostrar la app. */
export function RequireOnboarding() {
  const profile = useLocalProfile()
  const ready = !!profile

  // Mantiene los macros calculados al día con la fórmula vigente.
  useEffect(() => {
    if (ready) void nutritionService.refresh()
  }, [ready])

  if (profile === undefined) return <AppShellSkeleton />
  if (profile === null) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
