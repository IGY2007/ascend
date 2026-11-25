import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string | null
  createdAt: string | null
  /** Nombre cargado en el registro (metadatos). El perfil de la base es la fuente final. */
  metadataName: string | null
}

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  user: AuthUser | null
  session: Session | null
  /** true si no hay sesión válida en memoria pero sí guardada (típicamente: sin conexión). */
  isOfflineSession: boolean
  /** true cuando se entró desde el link de recuperación de contraseña. */
  isRecovery: boolean
  clearRecovery: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

/** Para pantallas protegidas: el usuario siempre existe. */
export function useUser(): AuthUser {
  const { user } = useAuth()
  if (!user) throw new Error('useUser requiere un usuario autenticado')
  return user
}
