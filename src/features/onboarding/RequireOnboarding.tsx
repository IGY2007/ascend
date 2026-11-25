import { Navigate, Outlet } from 'react-router'
import { useLocalProfile } from '@/features/profile/hooks'
import { AppShellSkeleton } from '@/app/layout/AppShellSkeleton'

/** Si todavía no hizo el cuestionario, lo manda ahí antes de mostrar la app. */
export function RequireOnboarding() {
  const profile = useLocalProfile()
  if (profile === undefined) return <AppShellSkeleton />
  if (profile === null) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
