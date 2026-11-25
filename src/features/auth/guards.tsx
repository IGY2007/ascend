import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from './auth-context'
import { AppShellSkeleton } from '@/app/layout/AppShellSkeleton'

/** Rutas que requieren sesión. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <AppShellSkeleton />
  if (status === 'unauthenticated')
    return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** Login, registro y recuperación: si ya hay sesión, al inicio. */
export function PublicOnly() {
  const { status, isRecovery } = useAuth()
  const location = useLocation()
  if (status === 'loading') return null
  if (status === 'authenticated' && !isRecovery) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />
  }
  return <Outlet />
}

/** Al entrar desde el link de recuperación, lleva a la pantalla de nueva contraseña. */
export function RecoveryRedirect() {
  const { isRecovery } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (
      isRecovery &&
      location.pathname !== '/reset-password' &&
      location.pathname !== '/forgot-password'
    ) {
      navigate('/reset-password', { replace: true })
    }
  }, [isRecovery, location.pathname, navigate])
  return null
}
